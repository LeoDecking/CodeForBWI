import "@ionic/core";
import { doubleKnapsack } from "../algorithm.worker";

// Asynchrone Schnittstelle für Nutzung des Algorithmus in der Konsole
// Die Angabe von transporterDriverWeights ist optional
(window as any).multipleKnapsack = async function (counts: number[], weights: number[], values: number[], transporterCapacities: number[], transporterDriverWeights?: number[]): Promise<{ counts: number[], countsTime: number, transporterCounts: number[][], transporterTime: number, value: number, time: number }> {
    if (!transporterDriverWeights) transporterDriverWeights = transporterCapacities.map(_ => 0);

    if (counts.length != weights.length || counts.length != values.length) throw "Hardware-Arrays haben nicht die gleiche Länge";
    if (counts.length == 0) throw "Keine Hardware-Arten";
    if ([counts, weights, values].some(a => a.some(x => x <= 0))) throw "Ungültige Werte";
    if (transporterCapacities.length != transporterDriverWeights.length) throw "Transporter-Arrays haben nicht die gleiche Länge";
    if (transporterCapacities.some((c, i) => c - transporterDriverWeights[i] < 0)) throw "Ungültige(r) Transporter";

    // Durch stenciljs wird die Funktion doubleKnapsack automatisch in einem Web Worker ausgeführt, sodass der Hauptthread nicht blockiert wird
    let result = await doubleKnapsack(counts.map((c, i) => ({ count: c, name: (i + 1) + ".", weight: weights[i], value: values[i] })), transporterCapacities.map((c, i) => c - transporterDriverWeights[i]));
    console.table(result.transporterCounts);
    return result;
};

// Kurze Erklärung in der Konsole
console.group("info");
console.log("Benutze diese Methode, um den Algorithmus zu testen:");
console.log("async multipleKnapsack(counts: number[], weights: number[], values: number[], transporterCapacities: number[], transporterDriverWeights?: number[])");
console.log("returns Promise<{ counts: number[], countsTime: number, transporterCounts: number[][], transporterTime: number, value: number, time: number }>")
console.groupEnd();