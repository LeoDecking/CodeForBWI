import { Component, Element, h, State, forceUpdate, Prop } from '@stencil/core';
import { createAnimation, loadingController, modalController, toastController } from '@ionic/core';
import { doubleKnapsack } from '../../algorithm.worker';
import { Item, Transporter } from '../../types';


// Dies ist die Hauptkomponente.
// Es wird eine kurze Erklärung angezeigt, darunter können dann die Transporter-Maße und die benötigten Hardware-Anforderungen eingegeben werden.
// Alternativ können auch zufällige Daten generiert werden (app-random) oder Daten importiert (app-import) werden
// Die Daten werden direkt als farbliche Balken dargestellt, damit man sich darunter besser etwas vorstellen kann.
// Nach der Berechnung werden die Hardware-Balken in die Transporter-Balken animiert (animation.ts).
// Sowohl die Hardware-Anforderungen als auch die berechnete Verteilung können als JSON exportiert werden.
@Component({
    tag: 'app-main',
    styleUrl: 'app-main.scss'
})
export class AppMain {

    @Prop({ mutable: true }) items: Item[] = [ // Alle Hardware-Anforderungen
        { name: "Notebook Büro 13\"", count: 205, weight: 2451, value: 40 },
        { name: "Notebook Büro 14\"", count: 420, weight: 2978, value: 35 },
        { name: "Notebook outdoor", count: 450, weight: 3625, value: 80 },
        { name: "Mobiltelefon Büro", count: 60, weight: 717, value: 30 },
        { name: "Mobiltelefon Outdoor", count: 157, weight: 988, value: 60 },
        { name: "Mobiltelefon Heavy Duty", count: 220, weight: 1220, value: 65 },
        { name: "Tablet Büro klein", count: 620, weight: 1405, value: 40 },
        { name: "Tablet Büro groß", count: 250, weight: 1455, value: 40 },
        { name: "Tablet outdoor klein", count: 540, weight: 1690, value: 45 },
        { name: "Tablet outdoor groß", count: 370, weight: 1980, value: 68 },
    ];
    @State() transporters: Transporter[] = [{ capacity: 1100000, driversWeight: 72400 }, { capacity: 1100000, driversWeight: 85700 }]; // Die beiden Transporter
    @State() oneTransporter: boolean = false; // In diesem state wird gespeichert, ob der zweite Transporter deaktiviert werden soll.
    oldTransporter: Transporter; // Wenn der zweite Transporter deaktiviert wird, wird er in diesem Attribut gespeichert, um später wieder geladen werden zu können.

    // Die Ober-/Untergrenzen der zufälligen Daten wird gespeichert, um beim nächsten Mal wieder benutzt werden zu können
    @Prop({ mutable: true }) randomBounds: { counts: { lower: number, upper: number }, weights: { lower: number, upper: number }, values: { lower: number, upper: number }, count: number };

    @State() loading: boolean = false; // true, wenn der Algorithmus im Hintergrund am rechnen ist oder die Animationen noch nicht abgeschlossen sind -> Steuerelemente werden deaktiviert
    @State() result: { // Das Ergebnis und zusätzliche Daten der letzten Berechnung
        counts: number[];
        countsTime: number;
        transporterCounts?: number[][];
        transporterTime?: number;
        value?: number;
        time?: number;
    };

    // Dieses Attribut zeigt an, ob die Animationen angezeigt werden sollen. Es wird als key-property der Farb-Balken benutzt, sobald man es ändert, werden die Balken neu gerendert und so zurückgesetzt
    private animated: boolean = false;


    @Element() el: HTMLElement; // Das aktuelle Element

    // Diese Methode animiert die farblichen Item- und Transporter-Balken. Die Länge eines Balkens entspricht dem Gesamtgewicht, also Anzahl*Gewicht
    // Die Methode wird aufgerufen, sobald die Gesamtverteilung berechnet wurde. Die restliche Berechnung wird als Promise übergeben.
    // Jedes Item hat insgesamt 4 Balken, die am Anfang übereinanderliegen und später für die einzelnen Darstellungen der items genutzt werden:
    // genutzte Items Tabelle, ungenutze Items Tabelle, ind Transporter 1, in Transporter 2
    // Animiert wird jeweils die Breite (width), die Verschiebung von der ursprünglichen Position (transform: translate), die Sichtbarkeit (opacity) Und die Ränder (border)
    // Wenn ein Balken so klein wäre, dass man ihn nicht mehr wirklich sehen könnte, wird er ganz ausgeblendet, da die border sonst die Dicke von jeweils 1px behalten würde.
    async animateBars(counts: number[], tCountsPromise: Promise<number[][]>): Promise<void> {
        // Die Länge der Balken wird relativ zu dem längsten Balken berechnet (Die beiden Transporter nebeneinander zählen als ein Balken)
        let maxWeight = [this.transporters.map(t => t.capacity - t.driversWeight).reduce((a, b) => a + b), ...this.items.map(i => i.count * i.weight)].sort((a, b) => b - a)[0];

        // Hälfte der itemBars unsichtbar für später. Diese Items werden später wieder neben der Tabelle angezeigt
        await createAnimation()
            .addElement(this.el.querySelectorAll(".itemBar:nth-of-type(2n)"))
            .beforeStyles({ "opacity": "0" }).play();

        // Transporter nebeneinander, Items in Transporter
        await createAnimation().duration(600)
            .easing("ease-out")
            .addAnimation(createAnimation()
                .addElement(this.el.querySelectorAll(".transporterBar"))
                .beforeStyles({ border: "1px solid black" }))
            .addAnimation(createAnimation()
                .addElement(this.el.querySelector(".transporterBar:nth-of-type(2)"))
                .duration(300)
                .fromTo("transform", "translate(0px, 0px)", "translate(" + 100 * (this.transporters[0].capacity - this.transporters[0].driversWeight) / ((this.transporters[1].capacity - this.transporters[1].driversWeight) || 1) + "%, -29px)")
                .afterStyles({ "border-left": "none" }))
            .addAnimation(this.items.map((item, i) => createAnimation()
                .addElement(this.el.querySelectorAll(".item" + i + ":nth-of-type(2n+1)"))
                .delay((this.items.length - i) * 50)
                .beforeStyles({ border: "1px solid black" })
                .afterStyles({ "border-left": "none" })
                .fromTo("width", 100 * (item.count * item.weight / maxWeight) + "%", 100 * (counts[i] * item.weight / maxWeight) + "%")
                .fromTo("opacity", 1, counts[i] * item.weight / maxWeight > 0.005 ? 1 : 0)
                .fromTo("transform", "translate(0px, 0px)", "translate(" + 100 * this.items.filter((_, i1) => i1 < i).map((item1, i1) => counts[i1] * item1.weight).reduce((a, b) => a + b, 0) / (counts[i] * item.weight || 1) + "%, " + (29 * (this.items.length - i) + 41) + "px)")
            ))
            .play();

        createAnimation()
            .addElement(this.el.querySelectorAll(".item" + counts.map((c, i) => [c, i]).filter(c => c[0] > 0)?.[0]?.[1]))
            .beforeStyles({ "border-left": "1px solid black" }).play();

        await Promise.all([
            // Balken in der Tabelle wieder sichtbar, Größenverhältnisse anpassen
            createAnimation()
                .duration(400)
                .addAnimation(this.items.map((item, i) => createAnimation()
                    .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n)"))
                    .fromTo("opacity", "0", 100 * (counts[i] * item.weight / maxWeight) > 0.005 ? "1" : "0")
                    .beforeStyles({ width: 100 * (counts[i] * item.weight / maxWeight) + "%" })
                ))
                .addAnimation(this.items.map((item, i) => createAnimation()
                    .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n+2)"))
                    .fromTo("opacity", "0", ((item.count - counts[i]) * item.weight / maxWeight) > 0.005 ? "1" : "0")
                    .beforeStyles({
                        width: 100 * ((item.count - counts[i]) * item.weight / maxWeight) + "%",
                        transform: "translateX(" + 100 * counts[i] / ((item.count - counts[i]) || 1) + "%)",
                        borderLeft: "none",
                        background: "hsla(" + i * (360 / this.items.length) + ", 90%, 60%, .15)",
                    })
                ))
                .play(), tCountsPromise.then(async tCounts => { // Hier wird erst gewartet bis die Berechnung vollständig abgeschlossen ist
                    // Items auf Transporter aufteilen (nebeneinander)
                    if (this.transporters[1].capacity - this.transporters[1].driversWeight > 0) {
                        await createAnimation()
                            .addAnimation(this.items.map((item, i) => createAnimation()
                                .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n+1)"))
                                .addAnimation(createAnimation()
                                    .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n+1)"))
                                    .duration(200)
                                    .keyframes([{ offset: 0, opacity: counts[i] * item.weight / maxWeight > 0.005 ? 1 : 0 }, { offset: 0.5, opacity: counts[i] * item.weight / maxWeight > 0.005 ? 0.1 : 0 }, { offset: 1, opacity: tCounts[0][i] * item.weight / maxWeight > 0.005 ? 1 : 0 }]))
                                .delay(100)
                                .duration(0)
                                .to("width", 100 * (tCounts[0][i] * item.weight / maxWeight) + "%")
                                .to("transform", "translate(" + 100 * this.items.filter((_, i1) => i1 < i).map((item1, i1) => counts[i1] * item1.weight).reduce((a, b) => a + b, 0) / (tCounts[0][i] * item.weight || 1) + "%, " + (29 * (this.items.length - i) + 41) + "px)")
                            ))
                            .addAnimation(this.items.map((item, i) => createAnimation()
                                .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n+3)"))
                                .addAnimation(createAnimation()
                                    .addElement(this.el.querySelector(".item" + i + ":nth-of-type(4n+3)"))
                                    .duration(200)
                                    .keyframes([{ offset: 0, opacity: counts[i] * item.weight / maxWeight > 0.005 ? 1 : 0 }, { offset: 0.5, opacity: counts[i] * item.weight / maxWeight > 0.005 ? 0.1 : 0 }, { offset: 1, opacity: tCounts[1][i] * item.weight / maxWeight > 0.005 ? 1 : 0 }]))
                                .delay(100)
                                .duration(0)
                                .to("width", 100 * (tCounts[1][i] * item.weight / maxWeight) + "%")
                                .to("transform", "translate(" + 100 * (this.items.filter((_, i1) => i1 < i).map((item1, i1) => counts[i1] * item1.weight).reduce((a, b) => a + b, 0) + tCounts[0][i] * item.weight) / (tCounts[1][i] * item.weight || 1) + "%, " + (29 * (this.items.length - i) + 41) + "px)")
                            ))
                            .play();

                        // Transporter wieder untereinander
                        await createAnimation()
                            .addElement(this.el.querySelector(".transporterBar:nth-of-type(2)"))
                            .duration(300)
                            .easing("ease-out")
                            .beforeStyles({ border: "1px solid black" })
                            .to("transform", "translate(0px, 0px)")
                            .play()

                        // Items auf Transporter aufteilen
                        await createAnimation()
                            .duration(300)
                            .easing("ease-out")
                            .addAnimation(this.items.map((item, i) => createAnimation()
                                .addElement(this.el.querySelectorAll(".item" + i + ":nth-of-type(4n+1)"))
                                .to("transform", "translate(" + 100 * this.items.filter((_, i1) => i1 < i).map((item1, i1) => tCounts[0][i1] * item1.weight).reduce((a, b) => a + b, 0) / ((tCounts[0][i] * item.weight) || 1) + "%, " + (29 * (this.items.length - i) + 41) + "px)")
                                .afterStyles({ "border-bottom": this.transporters[0].capacity - this.transporters[0].driversWeight <= this.transporters[1].capacity - this.transporters[1].driversWeight ? "none" : "" })
                            ))
                            .addAnimation(this.items.map((item, i) => createAnimation()
                                .addElement(this.el.querySelectorAll(".item" + i + ":nth-of-type(4n+3)"))
                                .to("transform", "translate(" + 100 * this.items.filter((_, i1) => i1 < i).map((item1, i1) => tCounts[1][i1] * item1.weight).reduce((a, b) => a + b, 0) / (tCounts[1][i] * item.weight || 1) + "%, " + (29 * (this.items.length - i + 1) + 41) + "px)")
                                .afterStyles({ "border-top": this.transporters[0].capacity - this.transporters[0].driversWeight > this.transporters[1].capacity - this.transporters[1].driversWeight ? "none" : "" })
                            ))
                            .play();

                        createAnimation()
                            .addElement(this.el.querySelector(".item" + this.items.findIndex((_, i) => tCounts[0][i] > 0) + ":nth-of-type(4n+1)"))
                            .addElement(this.el.querySelector(".item" + this.items.findIndex((_, i) => tCounts[1][i] > 0) + ":nth-of-type(4n+3)"))
                            .beforeStyles({ "border-left": "1px solid black" }).play();
                    }
                }).catch(() => { })
        ]);
    }

    // Dies wird gebraucht, um vor dem Start der Animation darauf zu warten, dass das update der Komponente abgeschlossen ist, insbesondere das animate-Attribut
    updatePromises: (() => void)[] = [];
    update(): Promise<void> {
        return new Promise(r => {
            this.updatePromises.push(r);
            forceUpdate(this.el);
        });
    }
    componentDidUpdate() {
        this.updatePromises.forEach(p => p());
        this.updatePromises = [];
    }


    render() {
        // Diese Werte werden zum Skalieren der einzelnen Balken benötigt
        let maxWeight = [this.transporters.map(t => t.capacity - t.driversWeight).reduce((a, b) => a + b), ...this.items.map(i => i.count * i.weight)].sort((a, b) => b - a)[0];
        let maxValue = this.items.map(i => i.value / i.weight).sort((a, b) => b - a)[0];

        return (<ion-app>
            <ion-header>
                <ion-toolbar color="primary">
                    <ion-buttons slot="start">
                        <ion-button>
                            <ion-icon name="code-working-outline" slot="icon-only"></ion-icon>
                        </ion-button>
                    </ion-buttons>
                    <ion-title>Code for BWI - Leo Decking</ion-title>
                    <ion-buttons slot="end">
                        <ion-button onClick={() => {
                            // Dieser Button wechselt den Vollbildmodus
                            if (document.fullscreenElement)
                                document.exitFullscreen();
                            else
                                document.documentElement.requestFullscreen();
                        }}>
                            <ion-icon name="scan-outline" slot="icon-only"></ion-icon>
                        </ion-button>
                    </ion-buttons>
                </ion-toolbar>
            </ion-header>

            <ion-content class="ion-padding">
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Erklärung</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        Dies ist die Einsendung von Leo Decking aus Paderborn zur Coding Challenge von get in IT und BWI.<br /><br />

                        Oben recht oder mit <i>F11</i> kann man in den Vollbildmodus gelangen. Ich empfehle die Seite mit einem modernen Browser wie Google Chrome zu öffnen.<br />
                        Dieses Programm kann die nach Nutzwert optimale Aufteilung von Hardware in zwei Transporter berechnen.<br />
                        In die Felder können auch andere Werte eingegeben werden, für die die Aufteilung berechnet werden soll.<br />
                        Alternativ können mit dem gelben Button rechts auch zufällige Werte generiert werden.<br />
                        Im Normalfall dauert die Berechnung nur den Bruchteil einer Sekunde. In Ausnahmefällen, gerade wenn man den Zufallsgenerator mit vielen Teilen nutzt, kann es jedoch auch (deutlich) länger dauern.<br />
                        Da der Algorithmus auf ähnliche Gegebenheiten wie in der Aufgabenstellung optimiert ist, kann er in ganz seltenen Fällen leider gar keine Lösung finden :(<br />
                        Wenn allerdings eine Lösung gefunden wurde, ist diese immer optimal.<br />
                        Du kannst den Algorithmus auch in der Entwicklerkonsole <i>(F12)</i> ausführen.<br /><br />

                        Das Verhältnis der horizontalen Linie zur Gesamtlänge eines Balkens zeigt des Nutzwert pro Gewicht (als Maßstab dient die Hardware mit dem besten Verhältnis).<br />
                        Wenn z.B. ein Drittel der Gegenstände einer Art genommen werden, wird auch ein Drittel der Linie genommen. Eine Optimale Lösung hat also möglichst viel "Linie".<br />
                        Halte mit der Maus auf einen der Balken, um weitere Informationen zu sehen.
                    </ion-card-content>
                </ion-card>,
            <ion-card>
                    <ion-card-header>
                        <ion-card-title>Benötigte Hardware, Kapazitäten und Nutzwerte</ion-card-title>
                        <div>
                            <ion-button color="warning" disabled={this.loading || !!this.result} size="small" fill="outline" onClick={() => modalController.create({ component: "app-random", componentProps: this.randomBounds, cssClass: "auto-size" }).then(modal => modal.present())}><ion-icon name="shuffle"></ion-icon>Zufällige Hardware generieren</ion-button>
                            <ion-button color="warning" disabled={this.loading || !!this.result} size="small" fill="outline" onClick={() => modalController.create({ component: "app-import", cssClass: "auto-size" }).then(modal => modal.present())}><ion-icon name="create-outline"></ion-icon>Hardware importieren</ion-button>
                        </div>
                    </ion-card-header>
                    <ion-card-content>
                        <div class="itemsDiv">
                            <ion-badge color={this.result?.transporterCounts ? "light" : "success"} onClick={this.result?.transporterCounts ? null : () => this.items = [...this.items, { name: "", count: 1, weight: 1, value: 1 }]}>
                                <ion-icon name="add-circle-outline"></ion-icon> Neu
                            </ion-badge>
                            <ion-badge title="Hardware">Hardware-Name</ion-badge>
                            <ion-badge title="Benötigte Anzahl">Anzahl</ion-badge>
                            <ion-badge title="Gewicht in g">Gewicht</ion-badge>
                            <ion-badge title="Nutzwert je Hardware-Einheit">Nutzwert</ion-badge>
                            <span class="resultBadges">
                                {/* Hier wird die Anzahl der items in den jeweiligen Transportern angezeigt */}
                                <ion-badge title="Transporter 1" hidden={!this.result?.transporterCounts} style={{ background: "#666666" }}>T1</ion-badge>
                                <ion-badge title="Transporter 2" hidden={!this.result?.transporterCounts} style={{ background: "#999999" }}>T2</ion-badge>
                            </span>
                            <ion-badge title="Gesamtgewicht (Anzahl * Gewicht)">Gesamtgewicht (Anzahl * Gewicht)</ion-badge>

                            {this.items.map((item, i) => {
                                // Die items bekommen jeweils eine eigene Farbe, um besonders die Balken wieder zu erkennen
                                let color = "hsl(" + i * (360 / this.items.length) + ", 90%, 60%)";
                                return [
                                    <ion-label style={{ color: color }}>{i + 1}.</ion-label>,
                                    <input placeholder="Name" disabled={!!this.result} style={{ border: `1px solid ${color}` }} onKeyUp={e => { item.name = (e.target as HTMLInputElement).value; forceUpdate(this.el); }} value={item.name} ></input>,
                                    <input placeholder="Anzahl" disabled={!!this.result} style={{ border: `1px solid ${color}` }} min={1} step={1} onInput={e => { item.count = parseFloat((e.target as HTMLInputElement).value); forceUpdate(this.el); }} type="number" value={item.count} ></input>,
                                    <input placeholder="Gewicht" disabled={!!this.result} style={{ border: `1px solid ${color}` }} min={1} step={1} onInput={e => { item.weight = parseFloat((e.target as HTMLInputElement).value); forceUpdate(this.el); }} type="number" value={item.weight} ></input>,
                                    <input placeholder="Nutzwert" disabled={!!this.result} style={{ border: `1px solid ${color}` }} min={1} step={1} onInput={e => { item.value = parseFloat((e.target as HTMLInputElement).value); forceUpdate(this.el); }} type="number" value={item.value} ></input>,
                                    <ion-button size="small" shape="round" fill="clear" hidden={!!this.result?.transporterCounts} onClick={() => toastController.create({
                                        message: "Willst du '" + (item.name || "Unbenannt") + "' wirklich entfernen?",
                                        color: "warning",
                                        duration: 2000,
                                        buttons: [
                                            { icon: "warning-outline", side: "start" },
                                            { icon: "trash-outline", text: "Ja", handler: () => { this.items = this.items.filter(i1 => i1 != item) } },
                                            { icon: "close", text: "Abbrechen" }
                                        ]
                                    }).then(toast => toast.present())}>
                                        <ion-icon name="trash-outline" color="danger"></ion-icon>
                                    </ion-button>,
                                    <span class="resultBadges" hidden={!this.result?.transporterCounts}>
                                        {/* Hier wird die Anzahl der items in den jeweiligen Transportern angezeigt */}
                                        <ion-badge style={{ background: "#666666" }}>{this.result?.transporterCounts?.[0][i]}</ion-badge>
                                        <ion-badge style={{ background: "#999999" }}>{this.result?.transporterCounts?.[1][i]}</ion-badge>
                                    </span>,
                                    // Jedes Item bekommt 4 Balken, die zu Anfang übereinander liegen, aber für die Animation gebraucht werden
                                    [0, 1, 2, 3].map(j =>
                                        // key={!this.animated + ""} Sobald sich das animated-Attribut ändert, wird der Balken neu gerendert und die Animation wird zurückgesetzt
                                        <div class={"itemBar item" + i} key={!this.animated + ""} title={(!this.result?.transporterCounts ? "" : (j % 2 == 1 ? (this.result?.transporterCounts?.[0][i] + this.result?.transporterCounts?.[1][i]) : (this.result?.transporterCounts?.[j == 0 ? 0 : 1][i])) + "/") + item.count + "x " + item.name + " - " + item.weight / 1000 + "kg mit Nutzwert " + item.value} style={{
                                            gridRow: (i + 2) + "",
                                            background: color,
                                            width: 100 * (item.count * item.weight / maxWeight) + "%",
                                            borderBottom: (this.items[i + 1]?.count ?? 0) * (this.items[i + 1]?.weight ?? 0) > item.count * item.weight ? "none" : "", // Die border zwischen zwei Balken wird nur von dem längeren Balken gezeichnet
                                            borderTop: (this.items[i - 1]?.count ?? 0) * (this.items[i - 1]?.weight ?? 0) >= item.count * item.weight ? "none" : ""
                                        }}>
                                            {/* Hiermit wird der Nutzwert als Linie dargestellt*/}
                                            <div style={{ width: 100 * (item.value / item.weight / maxValue) + "%", borderRight: item.value / item.weight >= 0.99 * maxValue ? "none" : "" }}></div>
                                            <div style={{ width: 100 * (item.value / item.weight / maxValue) + "%", borderRight: item.value / item.weight >= 0.99 * maxValue ? "none" : "" }}></div>
                                        </div>)
                                ];
                            })}
                            {/* Wenn die Eingaben ungültig sind, wird eine entsprechende Warnung angezeigt */}
                            <p hidden={this.items.length > 0} class="warning">Füge Hardware hinzu, um die optimale Verteilung zu berechnen.</p>
                            <p hidden={this.items.filter(item => isNaN(item.count) || item.count < 0 || isNaN(item.value) || item.value <= 0 || isNaN(item.weight) || item.weight <= 0).length != 1} class="warning">Eine Hardware-Sorte ist ungültig.</p>
                            <p hidden={this.items.filter(item => isNaN(item.count) || item.count < 0 || isNaN(item.value) || item.value <= 0 || isNaN(item.weight) || item.weight <= 0).length <= 1} class="warning">Mehrere Hardware-Sorten sind ungültig.</p>
                            <p hidden={this.transporters.every((transporter, i) => transporter.capacity > transporter.driversWeight || (i == 1 && this.oneTransporter))} class="warning">Einer der Transporter ist ungültig.</p>
                        </div>
                        <div class="transportersDiv">
                            <ion-badge color="light">#</ion-badge>
                            <ion-badge title="Maximale Kapazität in g">Kapazität</ion-badge>
                            <ion-badge title="Fahrer-Gewicht in g">Fahrer</ion-badge>
                            {
                                this.transporters.map((transporter, i) => {
                                    // Wie die items auch haben die Transporter eine eigene Farbe/Grauton
                                    let color = "rgb(" + (40 + i * 40 / this.transporters.length) + "%, " + (40 + i * 40 / this.transporters.length) + "%, " + (40 + i * 40 / this.transporters.length) + "%)";
                                    return [
                                        <ion-label>Transporter {i + 1}</ion-label>,
                                        <input placeholder="Kapazität" disabled={!!this.result || (i == 1 && this.oneTransporter)} style={{ border: `1px solid ${color}`, opacity: (i == 1 && this.oneTransporter) ? "0.2" : "1" }} min={1} step={1} onInput={e => { transporter.capacity = parseFloat((e.target as HTMLInputElement).value); forceUpdate(this.el); }} type="number" value={transporter.capacity}></input>,
                                        <input placeholder="Fahrer-Gewicht" disabled={!!this.result || (i == 1 && this.oneTransporter)} style={{ border: `1px solid ${color}`, opacity: (i == 1 && this.oneTransporter) ? "0.2" : "1" }} min={1} step={1} onInput={e => { transporter.driversWeight = parseFloat((e.target as HTMLInputElement).value); forceUpdate(this.el); }} type="number" value={transporter.driversWeight}></input>,
                                        <ion-badge hidden={!this.result?.transporterCounts || (transporter.capacity - transporter.driversWeight == 0)} style={{ background: color }}>{transporter.capacity - transporter.driversWeight - this.result?.transporterCounts?.[i].map((c, j) => c * this.items[j].weight).reduce((a, b) => a + b)}g frei</ion-badge>,
                                        <div class="transporterBar" key={!this.animated + ""} title={"Transporter " + (i + 1) + ": Kapazität " + transporter.capacity / 1000 + "kg - " + transporter.driversWeight / 1000 + "kg Fahrer"} style={{
                                            background: color,
                                            width: 100 * ((transporter.capacity - transporter.driversWeight) / maxWeight) + "%",
                                            opacity: ((transporter.capacity - transporter.driversWeight) / maxWeight) > 0.005 ? "1" : "0",
                                            borderBottom: (this.transporters[i + 1]?.capacity ?? 0) - (this.transporters[i + 1]?.driversWeight ?? 0) > transporter.capacity - transporter.driversWeight ? "none" : "",
                                            borderTop: (this.transporters[i - 1]?.capacity ?? 0) - (this.transporters[i - 1]?.driversWeight ?? 0) >= transporter.capacity - transporter.driversWeight ? "none" : ""
                                        }}></div>
                                    ];
                                })
                            }
                            {/* Der zweite Transporter kann deaktiviert werden, die aktuellen Eingaben werden aber gespeichert.*/}
                            <div style={{ gridColumn: "4", gridRow: "3" }}><ion-label>Nur ein Transporter</ion-label><ion-checkbox checked={this.oneTransporter} disabled={!!this.result} onIonChange={e => {
                                this.oneTransporter = e.detail.checked;
                                if (this.oneTransporter) {
                                    this.oldTransporter = this.transporters[1];
                                    this.transporters[1] = { capacity: 42, driversWeight: 42 };
                                } else
                                    this.transporters[1] = this.oldTransporter;
                            }}></ion-checkbox></div>
                        </div>
                        <div class="bottomDiv">
                            <div>
                                {/* Dieser button kopiert die aktuelle Berechnung als JSON in die Zwischenablage. */}
                                <ion-button color="warning" size="small" fill="outline" hidden={!this.result?.transporterCounts} disabled={this.loading} onClick={() => {
                                    let copy = {
                                        items: this.items,
                                        counts: this.items.map(item => item.count),
                                        weights: this.items.map(item => item.weight),
                                        values: this.items.map(item => item.value),
                                        transporter: this.transporters,
                                        transporterCapacities: this.transporters.map(transporter => transporter.capacity),
                                        transporterDriverWeights: this.transporters.map(transporter => transporter.driversWeight),
                                        result: this.result
                                    };
                                    // Zustätzlich wird in die Konsole geschrieben, falls das Kopieren nicht funktioniert hat.
                                    console.log(copy);

                                    navigator.clipboard.writeText(JSON.stringify(copy)).then(() => {
                                        toastController.create({ message: "Die Aufgabe wurde erfolgreich als JSON in deine Zwischenablage kopiert", color: "primary", duration: 1500, buttons: [{ side: "start", icon: "copy-outline" }] }).then(toast => toast.present());
                                    }).catch(() => {
                                        toastController.create({ message: "Beim Kopieren in die Zwischenablage gab es ein Problem. Kopiere aus der Entwicklerkonsole (F12)", color: "warning", duration: 1000, buttons: [{ side: "start", icon: "danger-outline" }] }).then(toast => toast.present());
                                    });

                                }}><ion-icon name="copy-outline">
                                    </ion-icon>Export
                                </ion-button>
                                {/* Dieser button startet die Berechnung, bei ungültigen Eingaben ist er deaktiviert. */}
                                <ion-button size="small" fill="outline" hidden={!!this.result?.transporterCounts} disabled={
                                    this.loading
                                    || this.items.length == 0
                                    || this.items.some(item => isNaN(item.count) || item.count < 0 || isNaN(item.value) || item.value <= 0 || isNaN(item.weight) || item.weight <= 0)
                                    || this.transporters.some((transporter, i) => transporter.capacity <= transporter.driversWeight && (i == 0 || !this.oneTransporter))} onClick={async () => {
                                        this.loading = true;
                                        this.animated = true;

                                        await this.update();

                                        let loading = await loadingController.create({ message: "Berechnung..." });
                                        await loading.present();

                                        // Durch stenciljs wird die Funktion doubleKnapsack automatisch in einem Web Worker ausgeführt, sodass der Hauptthread nicht blockiert wird
                                        let resultPromise = doubleKnapsack(this.items, this.transporters.map(t => t.capacity - t.driversWeight), async counts => {
                                            this.result = counts;
                                            loading.message = "Aufteilen auf Transporter...";

                                            let animate = this.animateBars(counts.counts, resultPromise.then(r => r.transporterCounts));

                                            this.result = await resultPromise.catch(e => {
                                                toastController.create({ message: e, color: "warning", duration: 3000, buttons: [{ side: "start", icon: "warning-outline" }] }).then(toast => toast.present());
                                                this.animated = false;
                                                return null;
                                            });
                                            console.log(this.result);
                                            loadingController.dismiss();

                                            if (this.result) {
                                                toastController.create({
                                                    message: `Eine optimale Verteilung auf ${this.oneTransporter ? "den" : "die"} Transporter wurde in ${this.result.time}ms gefunden.`,
                                                    color: "success",
                                                    duration: 2000,
                                                    buttons: [{ side: "start", icon: "thumbs-up-outline" }]
                                                }).then(toast => toast.present());
                                            }

                                            await animate;
                                            this.loading = false;
                                        });
                                    }}>
                                    <ion-icon name="calculator-outline" slot="icon-only"></ion-icon>
                                Berechnen
                                </ion-button>
                                {/* Dieser button setzt die Berechnung und die Animation zurück. Die muss gemacht werden, bevor die Eingaben geändert werden. */}
                                <ion-button size="small" fill="outline" hidden={!this.result?.transporterCounts} disabled={this.loading} onClick={async () => {
                                    this.result = null;
                                    this.animated = false;
                                    forceUpdate(this.el);
                                }}>
                                    <ion-icon name="refresh-outline" slot="icon-only"></ion-icon>
                                Berechnung Zurücksetzen
                            </ion-button>
                            </div>
                            {/* Kennzahlen der Berechnung */}
                            <ion-label color="primary" hidden={this.result?.value == null}>Gesamt-Nutzwert: <b>{this.result?.value}</b></ion-label>
                            <ion-label color="primary" hidden={this.result?.transporterTime == null}>Aufteilen auf Transporter: <b>{this.result?.transporterTime}ms</b></ion-label>
                            <ion-label color="primary" hidden={this.result?.countsTime == null}>Berechnung der Optimalverteilung: <b>{this.result?.countsTime}ms</b></ion-label>
                        </div>
                    </ion-card-content>
                </ion-card>
            </ion-content>
        </ion-app>);
    }
}
