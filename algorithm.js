//// Dies ist die Implementation des Algorithmus in JavaScript.
//// Programmiert wurde eigentlich in TypeScript. Die typisierte Version dieser Datei befindet sich hier: ./src/algorithm.worker.ts
//// Von der Funktionsweise stimmen beide Dateien überein, nur dass hier keine Typ-Angaben enthalten sind.

// Der Algorithmus kann zum Beispiel mit einer aktuellen Version von node ausgeführt werden, getestet wurde mit v12.13.1
// node algorithm.js
// Alternativ kann die ganze Datei auch in die Entwickler-Konsole deines Browsers kopiert und ausgeführt werden.
// Die Hardware-Anforderungen können in dieser Datei angepasst werden.
(async function () {
    console.log("Die Aufteilung für die vorgegebenen Hardware-Anforderungen werden nun berechnet.")
    let result = await doubleKnapsack([
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
    ], [1027600, 1014300]);

    console.log("Benötigte Zeit: ", result.time);
    console.log("Transporter 1:", result.transporterCounts[0]);
    console.log("Transporter 2:", result.transporterCounts[1]);
    console.log("Nutzwert: ", result.value);
}());


// Diese Implementation des knapsack-Algorithmus benutzt dynamische Programmierung.
// Die Gegenstand-Arten werden nacheinander durchgegangen und es wird jeweils in einer Liste der höchste Gesamtwert gespeichert, der mit einer bestimmten Rucksack-Größe erreicht werden kann (siehe knapsack() für genauere Informationen).
// In der Liste werden die erreichbaren Werte aufsteigend nach Gewicht bzw. benötigter Kapazität sortiert gespeichert.
// So kann durch binäre Suche sehr effizient der passende Eintrag gefunden, bzw. neue Einträge an der passenden Stelle hinzugefügt werden.
// Hierdurch kann schnell verglichen werden, ob eine mögliche Beladung sinnvoll ist, also ob sie einen größeren Nutzwert hat als die bisher beste Möglichkeit gleichen oder niedrigeren Gewichts.

// Ein Listeneintrag besteht aus der benötigten Kapazität, dem maximal erreichbaren Wert und der Anzahl der Gegenstände der Art, die gerade betrachtet wird, die bei dieser Möglichkeit noch übrig sind.


// In die nach Kapazität aufsteigend sortierte Liste wird der neue Eintrag an passender Stelle eingefügt.
// Wenn bereits ein Eintrag mit gleicher Kapazität vorhanden ist, wird dieser überschrieben.
// Dies geschieht durch eine Abwandlung der binären Suche.
// Man kann optional den Parameter a übergeben, der eine untere Schranke des Index darstellt (inklusiv).
function setValue(list, entry, a = 0) {
    let b = list.length - 1;

    while (a < b) {
        const m = Math.floor((a + b) / 2);

        if (list[m][0] < entry[0])
            a = m + 1;
        else if (list[m][0] > entry[0])
            b = m - 1;
        else // list[m][0] == entry[0]
        {
            list[m] = entry;
            return;
        }
    }

    if (list[b][0] == entry[0])
        list[b] = entry;
    else if (list[b][0] > entry[0])
        list.splice(b, 0, entry);
    else
        list.splice(b + 1, 0, entry);
}

// Es wird der Eintrag der nach Kapazität aufsteigend sortierten Liste zurückgegeben mit der größten benötigten Kapazität, die kleiner/gleich dem Parameter capacity ist.
// Dies geschieht durch eine Abwandlung der binären Suche.
// Man kann optional den Parameter a übergeben, der eine untere Schranke des Index darstellt (inklusiv).
function getValue(list, capacity, a = 0) {
    let b = list.length - 1;

    while (a < b) {
        const m = Math.floor((a + b) / 2);

        if (list[m][0] < capacity)
            a = m + 1;
        else if (list[m][0] > capacity)
            b = m - 1;
        else // list[m][0] == capacity
            return list[m];
    }

    if (list[b][0] > capacity)
        return list[b - 1];
    else
        return list[b];
}

// Es wird überprüft, ob es sinnvoll ist, mit einem bestimmten Gewicht einen Wert zu erreichen.
// Wenn zum Beispiel bekannt ist, dass man in einem 100kg "großen" Rucksack einen Wert von 42 erreichen kann, und man einen noch größeren Rucksack hat, dann ist es nur sinnvoll diesen auch mit mindestestens 100kg zu beladen.
// Diese Methode ähnelt getValue, jedoch wird nach jedem heraufsetzen der unteren Schranke a überprüft, ob der Wert v1 nicht auch schon nach aktuellem Stand mit dieser Kapazität erreicht werden kann. 
// Dies geschieht durch eine Abwandlung der binären Suche.
// Man kann optional den Parameter a übergeben, der eine untere Schranke des Index darstellt (inklusiv).
function worthIt(list, capacity, v1, a = 0) {
    let b = list.length - 1;

    while (a < b) {
        const m = Math.floor((a + b) / 2);

        if (list[m][0] < capacity) {
            if (list[m][1] > v1)
                return false;
            a = m + 1;
        }
        else if (list[m][0] > capacity)
            b = m - 1;
        else // list[m][0] == capacity
            return list[m][1] < v1;
    }

    if (list[b][0] > capacity)
        return list[b - 1][1] < v1;
    else
        return list[b][1] < v1;
}

// Dies ist die Methode, die nun immer eine optimale Auswahl der Gegenstände berechnet, die vom Gewicht her die capacity nicht überschreitet und den höchstmöglichen Nutzwert hat.
// Es wird ein dynamischer Programmieransatz verfolgt: Die unterschiedlichen Gegenstand-Arten werden nacheinander, absteigend nach "Effizienz" sortiert, durchgegangen.
// Für jedes mögliche, erlaubte Gewicht, dass durch eine Kombination der vorherigen Gegenstand-Arten mit einer beliebigen möglichen Anzahl des neuen Gegenstands erreicht werden kann, wird überprüft, ob der Nutzwert sich verbessert.
// So erhält man schließlich eine Tabelle, beziehungsweise für jede Gegenstands-Art i eine Zeile row, die die bestmöglichen Nutzwerte für alle möglichen Gewichte enthält, wenn man nur die Gegenstands-Arten 0 bis i benutzt.
// (Wenn in der Zeile kein Eintrag für ein spezielles Gewicht vorhanden ist, wird der nächsttiefere Wert genommen)
// In der letzten Zeile (also für alle Gegenstände wurde überprüft, welche Nutzwerte damit erreicht werden können) in der letzten Zelle steht nun der Nutzwert einer besten Kombination, die capacity durch ihr Gewicht nicht überschreitet.
// Nun kann die Tabelle Zeile für Zeile von hinten durchgegangen werden. Da in den jeweiligen Zellen ja auch die noch übrige Anzahl der Gegenstandsart der aktuellen Zeile steht, ergibt sich hieraus auch die Anzahl der "eingepackten" Gegenstände
// So wird nach und nach berechnet, wie oft ein jeder Gegenstand benötigt wird, um den optimalen Nutzwert zu erreichen.
// Durch den Parameter deviation kann die Berechnung vorzeitig abgebrochen werden, sobald eine optimale Auswahl gefunden wurde, deren Gewicht maximal um deviation von capacity abweicht.
// Dies wird nur beim späteren Aufteilen der Gegenstände auf zwei Transporter benötigt, da es hier genügt eine beliebige Verteilung zu finden, die in die jeweiligen Transporter passt.
function knapsack(items, capacity, deviation = 0) {
    // Sortieren der Gegenstands-Arten nach Effizienz, also Nutzwert pro Gewicht
    const sItems = [...items].sort((a, b) => b.value / b.weight - a.value / a.weight);
    const reversedIndexes = items.map(item => sItems.indexOf(item)); // Hiermit kann die Sortierung am Ende wieder rückgängig gemacht werden.


    // Hier werden die einzelnen Zeilen der jeweiligen Gegenstandsart gespeichert.
    const rows = [];
    // Die Zeile der aktuellen Gegenstandsart - es ist trivial, dass mit einer Kapazität von 0 maximal ein Nutzwert von 0 erreicht werden kann.
    let row = [[0, 0, 0]]; // [capacity, value, stock]

    // Nun werden die einzelnen sortierten Gegenstandsarten durchgegangen
    for (let i = 0; i < sItems.length; i++) {
        // Die neue Zeile enthält zu Beginn alle Einträge aus der vorherigen Zeile, da auch diese Kombinationen weiterhin möglich sind.
        // Die Anzahl der Gegenstände, die von der aktuellen Art noch übrig sind, entspricht der Gesamtanzahl, da in den vorherigen Zeilen der aktuelle Gegenstand gar nich benötigt wurde. 
        row = row.map(r => [r[0], r[1], sItems[i].count]);

        // Nun wird die aktuelle Zeile durchgegangen
        // Für jeden Eintrag wird überprüft, ob der Nutzwert, wenn man ein Gegenstand der aktuellen Art hinzufügt, besser ist, als das, was bisher möglich ist.
        // Wenn ja, wird ein neuer Eintrag hinzugefügt, dessen Gewicht selbstverständlich größer ist, als der Eintrag, dem ein Gegenstand hinzugefügt wurde.
        // Deshalb wird der neue Eintrag auch ganz normal durch die for-Schleife durchlaufen. D.h. auch dort wird überprüft, ob es sich lohnt, einen Gegenstand hinzuzufügen.
        // Somit werden nach und nach alle (sinnvollen) Möglichkeiten durchgegangen, eine beliebige Anzahl an Gegenständen der aktuellen Art hinzuzufügen.
        // Die lohnenswerten werden für dennächsten Durchgang mit der nächsten Gegenstands-Art gespeichert.
        for (let j = 0; j < row.length; j++) {
            const entry = row[j];

            if (entry[2] == 0)
                continue; // Für diesen Eintrag sind bereits alle Teile der aktuellen Art aufgebraucht.

            const nextCapacity = entry[0] + sItems[i].weight; // Die benötigte Kapazität des neuen Eintrags ist die Summe des aktuellen Eintrags und des Gewichts der aktuellen Gegenstands-Art
            if (nextCapacity > capacity)
                break; // Der neue Eintrag ist zu schwer


            const nextValue = entry[1] + sItems[i].value; // Der Nutzwert des neuen Eintrags ist die Summe des aktuellen Nutzwertes und des Nutzwerts der aktuellen Gegenstands-Art

            // Wenn es sich lohnt, wird der neue Eintrag gespeichert.
            // Also dann, wenn der Nutzwert mit der neuen Kapazität höher ist als das, was bisher mit maximal dem gleichen Gewicht erreicht werden konnte.
            if (worthIt(row, nextCapacity, nextValue, j + 1))
                setValue(row, [nextCapacity, nextValue, entry[2] - 1], j + 1);
        }
        rows.push(row);


        // Wenn mit den bisherigen Gegenständen bereits eine Kombination gefunden wurde, die maximal deviation kleiner als capacity ist, wird abgebrochen.
        // Wenn die gefundenen Gegenstände später auf zwei Transporter aufgeteilt werden, reicht es, wenn der "freie Raum" im einen Transporter maximal so groß ist, wie der Platz, der insgesamt übrig bleibt.
        // Dann passt der Rest in den anderen Transporter und es muss nicht unnötig eine Lösung gefunden werden, den aktuellen Transporter noch voller zu machen.
        if (capacity - row[row.length - 1][0] <= deviation)
            break;
    }


    // Nun werden die Gegenstandsarten von hinten durchgegangen, also zuerst die, die als letztes hinzugefügt wurden.

    let counts = []; // Hier wird die optimale Auswahl gespeichert, neue Elemente werden vorne vorgehangen.
    let weight = row[row.length - 1][0]; // Das übgrige Gewicht, welches noch aufgeteilt werden muss

    for (let i = rows.length - 1; i >= 0; i--) {
        const entry = getValue(rows[i], weight); // Der Eintrag, mit dem das Gewicht erreicht wurde, wird herausgesucht.
        counts.splice(0, 0, sItems[i].count - entry[2]); // Die Anzahl benutzer Gegenstände der aktuellen Art - die Differenz der maximal möglichen und der restlichen Gegenstände - wird zu counts hinzugefügt.
        weight -= (sItems[i].count - entry[2]) * sItems[i].weight; // Das Gesamtgewicht der Gegenstände der aktuellen Art wird abgezogen.
    }

    if (weight != 0)
        throw "Bei der Berechnung kam es leider zu einem Fehler :("; // Wenn noch Gewicht übrig bleibt, nachdem alle Gegenstände durchgelaufen sind, ist wohl etwas falsch gelaufen. Dies sollte nie auftreten.


    // Wenn zuvor durch deviation abgebrochen wurde, betrachtet row nur die ersten Gegenstände, die noch berücksichtigt wurden.
    // Nun counts wird hinten mit 0-en aufgefüllt, bis die passende Länge erreicht wurde.
    counts = [...counts, ...new Array(sItems.length - counts.length).fill(0)];


    counts = counts.map((_, i) => counts[reversedIndexes[i]]); // Anfängliche Sortierung wird rückgängig gemacht.

    // Zurückgegeben wird die optimale Auswahl und der Platz, der bei dieser noch frei bleibt.
    return [counts, capacity - row[row.length - 1][0]];
}


// Aufteilen von Gegenständen bestimmten Gewichts und begrenzter Anzahl auf zwei "Rucksäcke", so dass deren Nutzwert optimal ist.
// Zuerst wird die optimale Verteilung der Gegenstände auf einen imaginären Rucksack, dessen Kapazität der Summe der einzelnen Rucksäcke entspricht, berechnet.
// Die nun so entstandene optimale Verteilung kann nun auf die beiden kleineren Rucksäcke aufgeteilt werden.
// Dies geht bei ähnlichen Vorgaben wie mit der Hardware, die von der BWI benötigt wird, aufgrund der großen Anzahl an leichten Gegenständen im Verhältnis zur Transportergröße, in allen bisher betrachteten Fällen der Größenordnung.
// Hierzu wird wieder der gleiche Algorithmus verwendet. Diesmal wird die optimale Verteilung der Gegenstände, die auf beide Rucksäcke aufgeteilt werden müssen, für den ersten Rucksack berechnet.
// Als Nutzwert wird nun allerdings das Gewicht angegeben, da der erste Rucksack vom Platz her möglichst gut ausgenutzt werden soll. Die Rucksäcke werden absteigend nach Gesamtgewicht sortiert, um im Idealfall möglicht wenige Gegenstand-Sorten zu benötigen.
// Vorzeitig kann der Algorithmus diesmal schon abgebrochen werden, sobald eine Verteilung gefunden wurde, die im ersten Rucksack höchstens soviel Freiraum lässt, wie die optimale Verteilung im imaginären, großen Rucksack.
async function doubleKnapsack(items, capacities, resolveCounts) {
    // Optimale Aufteilung nach Nutzwert in einen imaginären, großen Rucksack
    let startTime = new Date().getTime();
    const [counts, empty] = knapsack(items, capacities[0] + capacities[1]);
    let countsTime = new Date().getTime() - startTime;

    // Für die Animation wird diese Aufteilung schon zurückgegeben
    if (resolveCounts)
        resolveCounts({ counts: counts, countsTime: countsTime });


    // Sortierung absteigend nach Gesamtgewicht (Gewicht*Anzahl), hierdurch werden im besten Fall nicht so viele unterschiedliche Gegenstände benötigt.
    const sIndexes = items.map((item, i) => [i, item.weight * counts[i]]).sort((a, b) => b[1] - a[1]).map(i => i[0]);
    const reversedIndexes = items.map((_, i) => sIndexes.indexOf(i));
    const sItems = sIndexes.map(i => (Object.assign(Object.assign({}, items[i]), { value: items[i].weight, count: counts[i] })));

    // Die Gegenstände der Verteilung werden nun bestmöglich nach Gewicht in dem kleineren Rucksack platziert.
    // Es reicht, wenn eine Verteilung gefunden wurde, die maximal empty Platz frei hat, da dann alle anderen Gegenstände in den zweiten Rucksack passen.
    let smallIndex = capacities.indexOf(Math.min(...capacities));
    let [counts0, empty0] = knapsack(sItems, capacities[smallIndex], empty);

    // Es wurde nicht geschafft, die optimale Verteilung auf beide Rucksäcke aufzuteilen.
    // Dies sollte bei zu der Aufgabenstellung ähnlichen Vorraussetzungen nicht vorkommen.
    if (empty0 > empty)
        throw "Der Algorithmus hat es nicht geschafft die optimale Hardware auf zwei Transporter aufzuteilen. Dies sollte bei änhlicher Hardware wie in der Aufgabenstellung nicht passieren.";

    // Sortierung wieder wie gegeben
    counts0 = reversedIndexes.map(i => counts0[i]);

    // Die Gegenstände, die nicht im kleineren Rucksack sind, kommen in den zweiten.
    const counts1 = items.map((_, i) => counts[i] - counts0[i]);
    return {
        counts: counts,
        countsTime: countsTime,
        transporterCounts: (smallIndex == 0 ? [counts0, counts1] : [counts1, counts0]),
        transporterTime: new Date().getTime() - countsTime - startTime,
        value: items.map((item, i) => item.value * counts[i]).reduce((a, b) => a + b),
        time: new Date().getTime() - startTime
    };
}
