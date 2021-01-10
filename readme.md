# Code for BWI - Leo Decking👨‍💻
Hallo, ich bin Leo Decking aus Paderborn und dies ist meine Einsdung zur Coding Challgenge von get in IT und BWI 2020/2021.

Ich bin 20 Jahre alt und studiere seit November im ersten Semester Informatik an der Universtität Paderborn.

## Der Algorithmus🔀
Bei der Aufgabenstellung handelt es sich um ein **multiple bounded knapsack** Problem.

Ich habe mich für einen **dynamischen Programmieransatz** entschieden, der auf schnellem Weg eine optimale Lösung findet. Zuerst berechne ich eine optimale Auswahl an Hardware für einen Transporter, der so groß ist wie beide Transporter zusammen, anschließend wird diese auf beide Transporter aufgeteilt.

Dies ist sehr effizient und die Aufteilung auf zwei Transporter ist bei änhlichen Hardware-Vorgaben eigentlich immer möglich.

Genauere Informationen stehen hierzu im **Quellcode**, besonders in der Datei **`src/algorithm.worker.ts`.**

## Die Umsetzung🎉
Damit man das Ergebnis des Algorithmus besser versteht und man auch andere Situationen mit dem Algorithmus schön und schnell berechnen lassen kann, habe ich ihn im Rahmen einer **Web-App** implementiert.

Hierfür habe ich "https://stenciljs.com/", was react sehr ähnelt, und die Komponenten des https://ionicframework.com/ benutzt, um so eine ansprechende intuitive Nutzeroberfläche zu gestalten.

Programmiert habe ich in **TypeScript**. Das ist eine Obermenge von **JavaScript**, die eine Typisierung im Code ermöglicht, um so auch bei größeren Projekten die Übersichtlichkeit zu bewahren. Der TypeScript-Code wird durch den stencil compiler in **JavaScript** übersetzt, welches dann vom eigenen Browser selber ausgeführt wird.

Der Algorithmus selber ist auch noch einmal in der JavaScript-Version im Repository enthalten: **`algorithm.js`**

Die Oberfläche ermöglicht es sowohl die Verteilung für die vorgegebenen Anforderungen zu berechnen, diese können angepasst werden. Es können aber auch eigene Hardware-Werte importiert werden oder zufällige generiert werden, um so Stärken und evt. Schwächen der Implementation zu betrachten.  
Nach der Berechnung kann das Ergebnis auch als *JSON* exportiert werden.

Für jede Hardware-Art gibt es einen farblichen Balken, der nach der Berechnung **animiert** wird, um das Ergebnis schön dazu stellen.

In der **Entwicklerkonsole** kann man die asynchrone Funktion `multipleKnapsack(counts: number[], weights: number[], values: number[], transporterCapacities: number[], transporterDriverWeights?: number[])` benutzen, um den Algorithmus auszuführen.  
Diese gibt ein folgendes Object zurück: `Promise<{ counts: number[], countsTime: number,transporterCounts: number[][], transporterTime: number, value: number, time: number }>`

## Ausführen🏃
Die reine JavaScript-Version des Algorithmus kann im einfachsten Fall ausgeführt werden, indem der Inhalt in die Entwicklerkonsole deines Webbrowsers eingefügt und anschließend ausgeführt wird.

Alternativ kann er auch mit einer aktuellen Node-Version ausgeführt werden (getestet mit v12.13.1): **```node algorithm.js```**

---
Für die lokale Ausführung der WebApp wird ebenfalls Node benötigt.

Zuerst müssen die nötigen Dependencies (Ionic und Stencil) installiert werden: **```npm install```**  
Anschließend kann das Projekt erstellt und ausgeführt werden: **```npm start```**  
Nachdem das Projekt erstellt wurde, wird es auf einem lokalen WebServer im Normalfall unter **```http://localhost:3333```** bereitgestellt. Hierfür am besten einen aktuellen WebBrowser wie z.B. Google Chrome nutzen.

Weitere Informationen dazu gibt es hier: https://stenciljs.com/docs/introduction

## Ergebnis⚖️
Dies ist eine optimale Verteilung von Hardware auf die beiden Transporter:

```cs
    Hardware:         1,   2,   3,   4,   5,   6,   7,   8,   9,  10
   ################################################################################
/**/Transporter 1: [  0,   0,   0,  60, 157, 220, 379,   0,   4,  11 ] -> 29g frei/**/
/**/Transporter 2: [  0,   0,   0,   0,   0,   0, 216,   0,   0, 359 ] ->  0g frei/**/
   ################################################################################

Gesamtnutzwert: 74.660
```


## Dateistruktur📁
**`src\assets`**: Icons

**`src\components`**: Die einzelnen Web-Komponenten, jeweils `*.tsc` (Code) und `*.scss` (Style)   
**`src\components\app-import`**: Komponente, um Hardware-Anforderungen zu importieren  
**`src\components\app-main`**: Hauptkomponente, von der aus alles gesteuert wird  
**`src\components\app-random`**: Komponente, um Hardware-Anforderungen zufällig zu generieren

**`src\global\app.scss`**: Globale Styleanweisungen   
**`src\global\app.ts`**: Entwicklerkonsolenzugriff auf den Algorithmus

**`src\algorithm.worker.ts`**: Der Algorithmus selber, wird von StencilJs als Web Worker geladen   
**`src\index.html`**: Die html-Einstiegsdatei   
**`src\index.ts`**: Die TypeScript-Einstiegsdatei   
**`src\manifest.json`**: WebApp-Manifest   
**`src\types.ts`**: Eigene TypeScript Typen: **`Item`** und **`Transporter`**

**`algorithm.js`**: Die JavaScript-Version des Algorithmus  
**`package.json`**: Die Node-Paket-Datei  
**`readme.md`**: Das hier😉  
**`stencil.config.ts`**: Konfiguration für den Stencil-Compiler
**`tsconfig.ts`**: TypeScript-Konfiguration

