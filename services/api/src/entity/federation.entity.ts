export enum FederationEntity {
    FSGT = 'FSGT',
    UFOLEP = 'UFOLEP',
    FFC = 'FFC',
    CYCLOS = 'CYCLOS',
    FFVELO = 'FFVELO',
    NL = 'NL',
    FFTRI = 'FFTRI',
}

export const findFederationEntityByValue = (value: string) => {
    if (Object.values(FederationEntity).includes(value as FederationEntity)) {
        return value as FederationEntity;
    }
    return null;
}
