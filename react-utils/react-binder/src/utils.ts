// TODO: REMOVE and Make its own package.

export function jsonCopy(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

export function shallowCopy(obj: any): any {
    if(primitives.has(typeof obj)) return obj;
    return {...obj};
}

type Visited = WeakMap<object, object>;

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
export function deepCopy(obj: any) {
    const visited: Visited = new WeakMap<object, object>();
    const result = _deepCopy(obj, visited);
    return result;
}

const primitives = new Set<string>(['string', 'number', 'boolean', 'bigint', 'symbol', 'null', 'undefined']);
function _deepCopy(obj: any, visited: Visited) {
    const isPrimitive = primitives.has(typeof obj);
    if(isPrimitive) {
        return obj;
    }

    // Handle basic collection objects
    if(Array.isArray(obj)) {
        return deepCopyArray(obj, visited);
    }

    if(obj instanceof Map) {
        return deepCopyMap(obj, visited)
    }

    if(obj instanceof Set) {
        return deepCopySet(obj, visited);
    }

    if(obj instanceof WeakMap) {
        return deepCopyWeakMap(obj, visited);
    }

    if(obj instanceof WeakSet) {
        return deepCopyWeakSet(obj, visited);
    }

    const copy: any = {}
    visited.set(obj, copy);
    let entries = Object.entries(obj);
    for(let i = 0; i < entries.length; i++) {
        const [key, val] = entries[i];
        if(typeof val === 'object') {
            const valCopy = visited.get(val as object) ?? _deepCopy(val as object, visited);
            copy[key] = valCopy;
            visited.set(val as object, valCopy);
        }
        else {
            copy[key] = obj[key];
        }
    }

    return copy;
}

function deepCopyArray<T>(array: T[], visited: Visited): T[] {
    const result = array.map(x => _deepCopy(x, visited));
    return result;
}

function deepCopySet<T>(set: Set<T>, visited: Visited): Set<T> {
    const result = new Set<T>();
    const array = Array.from(set);
    for(let i = 0; i < array.length; i++) {
        const val = array[i];
        const copy = _deepCopy(val, visited);
        result.add(copy);
    }

    return result;
}

function deepCopyMap<K, V>(map: Map<K, V>, visited: Visited) {
    const result = new Map<K, V>()
    const entries = Array.from(map.entries());
    for(let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i];
        result.set(_deepCopy(k, visited), _deepCopy(v, visited));
    }

    return result;
}

/**
 * WeakSet<K> Facacdc go simulate WeakSet deep copy.
 */
class WeakSetFacade<T extends object> extends WeakSet<T>{
    weakSet = new WeakSet<T>();
    notInherited = new WeakSet<T>();
    orig: {
        add: (x: T) => WeakSet<T>,
        delete: (x: T) => boolean,
        has: (x: T) => boolean
    }

    constructor(weakSet: WeakSet<T>) {
        super();

        // Overrie functions to support passing on the operations
        this.orig = {
            delete: weakSet.delete,
            add: weakSet.add,
            has: weakSet.has
        }
        weakSet.delete = (x: T) => {
            const origHas = this.orig.delete(x);
            if(this.notInherited.has(x)) {
                return origHas;
            }
            
            if(origHas) {
                this.weakSet.add(x);
                this.notInherited.add(x);
            }
            return this.orig.delete(x);
        }
    }

    /**
     * Appends a new object to the end of the WeakSet.
     */
    add(value: T): this {
        this.weakSet.add(value);
        this.notInherited.add(value);
        return this;
    }

    /**
     * Removes the specified element from the WeakSet.
     * @returns Returns true if the element existed and has been removed, or false if the element does not exist.
     */
    delete(value: T): boolean {
        if(this.notInherited.has(value)) {
            return this.delete(value);
        }

        this.notInherited.add(value);
        return this.orig.has(value);
    }

    /**
     * @returns a boolean indicating whether an object exists in the WeakSet or not.
     */
    has(value: T): boolean {
        if(this.notInherited.has(value)) {
            return this.weakSet.has(value);
        }
        return this.orig.has(value);
    }
}

function deepCopyWeakSet<T extends object>(set: WeakSet<T>, visited: Visited): WeakSet<T> {
    const result = new WeakSetFacade<T>(set);
    return result;
}

/**
 * WeakMap<K, V> Facacde to simulate WeakMap deep copy.
 */
class WeakMapFacade<K extends object, V> extends WeakMap<K, V>{
    weakMap = new WeakMap<K, V>();
    notInherited = new WeakSet<K>();
    orig: {
        set: (k: K, v: V) => WeakMap<K, V>,
        get: (k: K) => V | undefined,
        has: (k: K) => boolean,
        delete: (k: K) => boolean
    }

    constructor(orig: WeakMap<K, V>) {
        super();

        // Overrie functions to support passing on the operations
        this.orig = {
            set: orig.set,
            get: orig.get,
            has: orig.has,
            delete: orig.delete
        };

        orig.delete = (k: K) => {
            // Not inherited no need to promote
            if(this.notInherited.has(k)) {
                return this.orig.delete(k);
            }
            // Promote value original value to this.
            const origVal = this.orig.get(k);
            if(origVal !== undefined) {
                this.weakMap.set(k, origVal);
                this.notInherited.add(k);
            }
            return this.orig.delete(k);
        };

        orig.set = (k: K, v: V) => {
            // Not inherited no need to promote
            if(this.notInherited.has(k)) {
                this.orig.set(k , v);
            }
            // Promote original value to this.
            const origVal = this.orig.get(k);
            if(origVal !== undefined) {
                this.weakMap.set(k, origVal);
                this.notInherited.add(k);
            }
            return this.orig.set(k, v);
        }
    }
    /**
     * @returns a specified element.
     */
    get(key: K): V | undefined {
        if(this.notInherited.has(key)) {
            return this.weakMap.get(key);
        }
        return this.orig.get(key);
    }
    /**
     * @returns a boolean indicating whether an element with the specified key exists or not.
     */
    has(key: K): boolean {
        if(this.notInherited.has(key)) {
            return this.weakMap.has(key);
        }
        return this.orig.has(key);
    }
    /**
     * Adds a new element with a specified key and value.
     * @param key Must be an object.
     */
    set(key: K, value: V): this {
        this.weakMap.set(key, value);
        this.notInherited.add(key);
        return this;
    }
    /**
     * Removes the specified element from the WeakMap.
     * @returns true if the element was successfully removed, or false if it was not present.
     */
    delete(key: K): boolean {
        if(this.notInherited.has(key)) {
            return this.weakMap.delete(key);
        }
        this.notInherited.add(key);
        return this.orig.has(key);
    }
}

// TODO: Fix this does not work
function deepCopyWeakMap<K extends object, V>(weakMap: WeakMap<K, V>, visited: Visited): WeakMap<K, V> {
    return new WeakMapFacade(weakMap);
}

