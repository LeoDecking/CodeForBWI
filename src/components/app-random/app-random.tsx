import { modalController, toastController } from '@ionic/core';
import { Component, forceUpdate, h, Prop } from '@stencil/core';
import { Item } from '../../types';


// Diese Komponente ermöglicht es, zufällige Hardware-Anforderungen zu generieren.
// Durch range-inputs kann ausgewählt werden in welchem Bereich sich die Attribute der einzelnen Hardware-Arten befinden sollen.
// Somit können Stärken und Schwächen des Algorithmus gefunden werden.
@Component({
    tag: 'app-random',
    styleUrl: 'app-random.scss'
})
export class AppRandom {
    // Standardmäßig entspricht der Wertebereich der einzelnen Attribute in etwa dem Wertebereich in der Aufgabenstellung
    // Die geänderten Werte werden nach dem Generieren der Zufallsitems in der Main-Komponente für das nächste Mal gespeichert und können als property übergeben werden
    @Prop() counts: { lower: number, upper: number } = { lower: 50, upper: 700 };
    @Prop() weights: { lower: number, upper: number } = { lower: 500, upper: 4000 };
    @Prop() values: { lower: number, upper: number } = { lower: 25, upper: 100 };

    @Prop() count: number = 10; // Anzahl an Hardware-Arten die generiert werden sollen


    // Erzeugen einer zufälligen Ganzzahl zwischen lower und upper
    private static random(bounds: { lower: number, upper: number }): number {
        return bounds.lower + Math.round(Math.random() * (bounds.upper - bounds.lower));
    }

    render() {
        return [
            <ion-card-header>
                <ion-card-title>Zufällige Hardware</ion-card-title>
                <ion-icon name="close" onClick={() => modalController.dismiss()}></ion-icon>
            </ion-card-header>,
            <ion-card-content>
                <p>
                    In diesem Fenster kannst du automatisch zufällige Angaben generieren lassen, für die anschließend die optimale Verteilung auf die/den Transporter berechnet werden kann.<br />
                    Wähle zusätzlich zu der Anzahl an Hardware-Arten jeweils den Bereich aus, in dem sich die zufälligen Werte für Anzahl, Gewicht und Nutzwert pro Einheit befinden sollen.<br />
                    Passe auch die Transporter-Größen an oder versuche es erst einmal nur mit einem Transporter.<br />
                    Taste dich am besten langam heran, da die Berechnung je nach Einstellungen sehr lange dauern kann.
                </p>
                <ion-label><b>Anzahl:</b></ion-label>
                <ion-range dualKnobs min={1} max={2000} pin value={this.counts} onIonChange={e => this.counts = e.detail.value as { lower: number, upper: number }}>
                    <ion-label slot="start">{this.counts?.lower}</ion-label>
                    <ion-label slot="end">{this.counts?.upper}</ion-label>
                </ion-range>
                <ion-label><b>Gewicht:</b></ion-label>
                <ion-range dualKnobs min={1} max={10000} pin value={this.weights} onIonChange={e => this.weights = e.detail.value as { lower: number, upper: number }}>
                    <ion-label slot="start">{this.weights?.lower}</ion-label>
                    <ion-label slot="end">{this.weights?.upper}</ion-label>
                </ion-range>
                <ion-label><b>Nutzwert:</b></ion-label>
                <ion-range dualKnobs min={1} max={1000} pin value={this.values} onIonChange={e => this.values = e.detail.value as { lower: number, upper: number }}>
                    <ion-label slot="start">{this.values?.lower}</ion-label>
                    <ion-label slot="end">{this.values?.upper}</ion-label>
                </ion-range>
                <ion-label><b>Hardware-Arten:</b></ion-label>
                <ion-range min={1} max={100} pin value={this.count} onIonChange={e => this.count = e.detail.value as number}>
                    <ion-label slot="end">{this.count}</ion-label>
                </ion-range>

                <ion-button color="warning" fill="outline" size="small" onClick={() => {
                    // Die items der Main-Komponente werden mit einer passenden Anzahl an zufällig neu generierten items überschrieben.
                    let items = [];

                    for (let i = 0; i < this.count; i++)
                        items.push({
                            name: (Math.random()).toString(36).toUpperCase().substr(2), // Zufällige alphanumerische Zeichenkombination
                            count: AppRandom.random(this.counts),
                            weight: AppRandom.random(this.weights),
                            value: AppRandom.random(this.values)
                        } as Item);

                    document.querySelector("app-main").items = items;

                    // Die Grenzen werden für das nächste Mal gespeichert
                    document.querySelector("app-main").randomBounds = { counts: this.counts, weights: this.weights, values: this.values, count: this.count };
                    forceUpdate(document.querySelector("app-main"));
                    toastController.create({ message: `Es wurden ${this.count} zufällige Hardware-Arten generiert.`, duration: 2000, color: "warning", buttons: [{ side: "start", icon: "shuffle" }] }).then(toast => toast.present());
                    modalController.dismiss();
                }}><ion-icon name="shuffle"></ion-icon>Zufällig generieren</ion-button>
            </ion-card-content>
        ];
    }
}
