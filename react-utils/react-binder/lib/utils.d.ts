export declare function jsonCopy(obj: any): any;
export declare function shallowCopy(obj: any): any;
/**
 * Copies an entire object keeping references to objects within the {@link obj}
 * which means it supports ciruclar references which is not supported by other
 * copy methods like JSON.stringify(JSON.parse(obj)).
 *
 * It does support WeakMaps and WeakSets but it is NOT recommended for copy intensive
 * scenarios like React state copy as it is achieved by keeping copy of all previous
 * WeakMaps and WeakSets leading to possible memory.
 *
 * @param obj Object to copy.
 * @returns Return a copy of the object.
 */
export declare function deepCopy(obj: any): any;
