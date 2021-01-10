import { modalController, toastController } from '@ionic/core';
import { Component, forceUpdate, h, State } from '@stencil/core';

// Diese Komponente ermöglichst das Importieren von Datensätzen, zum Beispiel um den Algorithmus mit anderen zu vergleichen.
@Component({
    tag: 'app-import',
    styleUrl: 'app-import.scss'
})
export class AppImport {

    // Die *Input states speichern den Inhalt der Textboxen
    // Bei Veränderungen der Eingabe werden die Listen aktualisiert
    @State() names: string[];
    @State() namesInput: string;
    @State() counts: number[];
    @State() countsInput: string;
    @State() weights: number[];
    @State() weightsInput: string;
    @State() values: number[];
    @State() valuesInput: string;

    componentWillLoad() {
        // Standardmäßig stehen die aktuellen Items in den Textfeldern
        let items = document.querySelector("app-main").items;
        this.names = items.map(item => item.name);
        this.counts = items.map(item => item.count);
        this.weights = items.map(item => item.weight);
        this.values = items.map(item => item.value);
        [this.namesInput, this.countsInput, this.weightsInput, this.valuesInput] = [this.names, this.counts, this.weights, this.values].map(a => a.join(", "));
    }


    render() {
        // Bei ungültiger Eingabe wird eine Warnmeldung angezeigt und der "Importieren"-Button deaktiviert
        let warning;
        if (this.counts.length != this.names.length || this.counts.length != this.weights.length || this.counts.length != this.values.length) warning = "Listen haben nicht die gleiche Länge";
        else if (this.counts.length == 0) warning = "Füge die Werte in die Eingabefelder ein";
        else if ([this.counts, this.weights, this.values].some(a => a.some(x => isNaN(x) || x <= 0))) warning = "Ungültige Werte";

        return [
            <ion-card-header>
                <ion-card-title>Hardware importieren</ion-card-title>
                <ion-icon name="close" onClick={() => modalController.dismiss()}></ion-icon>
            </ion-card-header>,
            <ion-card-content>
                <p>
                    Füge in die Eingabefelder die Werte für die einzelnen Hardware-Arten ein.<br />
                    Als Trennzeichen kann Komma oder Semikolon genutzt werden.
                </p>
                <ion-label><b>Name:</b></ion-label>
                {/* Bei Text-Änderungen wird der Textbox-Inhalt bei Kommata/Semikolons getrennt (ein Trennungszeichen am Ende wird ignoriert) und ggf. in eine Zahl umgewandelt. */}
                <input placeholder="Art 1, Art 2, Art 3..." value={this.namesInput} onInput={e => { this.namesInput = (e.target as HTMLInputElement).value; this.names = this.namesInput.trim().replace(/[,;]$/, "").split(/,|;/); }}></input>
                <ion-label><b>Anzahl:</b></ion-label>
                <input placeholder="Art 1, Art 2, Art 3..." value={this.countsInput} onInput={e => { this.countsInput = (e.target as HTMLInputElement).value; this.counts = this.countsInput.trim().replace(/[,;]$/, "").split(/,|;/).map(s => parseInt(s)); }}></input>
                <ion-label><b>Gewicht:</b></ion-label>
                <input placeholder="Art 1, Art 2, Art 3..." value={this.weightsInput} onInput={e => { this.weightsInput = (e.target as HTMLInputElement).value; this.weights = this.weightsInput.trim().replace(/[,;]$/, "").split(/,|;/).map(s => parseInt(s)); }}></input>
                <ion-label><b>Nutzwert:</b></ion-label>
                <input placeholder="Art 1, Art 2, Art 3..." value={this.valuesInput} onInput={e => { this.valuesInput = (e.target as HTMLInputElement).value; this.values = this.valuesInput.trim().replace(/[,;]$/, "").split(/,|;/).map(s => parseInt(s)); }}></input>
                <i>{warning}</i>
                <ion-button color="warning" fill="outline" size="small" disabled={!!warning} onClick={() => {
                    // Die items der main-Komponente werden überschrieben
                    document.querySelector("app-main").items = this.names.map((name, i) => ({ name: name, count: this.counts[i], weight: this.weights[i], value: this.values[i] }));
                    forceUpdate(document.querySelector("app-main"));
                    toastController.create({ message: `Es wurden ${this.names.length} Hardware-Arten importiert.`, duration: 2000, color: "warning", buttons: [{ side: "start", icon: "create-outline" }] }).then(toast => toast.present());
                    modalController.dismiss();
                }}><ion-icon name="create-outline"></ion-icon>{warning ? "" : this.names.length} Importieren</ion-button>
            </ion-card-content>
        ];
    }
}
