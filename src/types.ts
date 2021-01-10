// Dieser Typ beschreibt eine einzelne Hardware-Art
export type Item = {
    name: string;
    count: number;
    weight: number;
    value: number;
}

// Dieser Typ beschreibt einen einzelnen Transporter
export type Transporter = {
    capacity: number;
    driversWeight: number;
}