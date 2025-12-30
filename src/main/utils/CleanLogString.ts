/**
 * Nettoie les logs retournés par les scripts shell (supprime les codes ANSI)
 * @param stout string ou autre type
 * @returns string nettoyé ou valeur originale si ce n'est pas une string
 */
export const cleanLogString = (stout: string | any) => {
    if (typeof stout !== 'string') return stout
    // eslint-disable-next-line no-control-regex
    const gm = new RegExp(']2;(.*)]1; ?(\n?)', 'gm')
    if (stout.match(gm)) return stout.replace(gm, '')
    else return stout
}
