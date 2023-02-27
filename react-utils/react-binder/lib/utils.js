"use strict";
// TODO: REMOVE and Make its own package.
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepCopy = exports.shallowCopy = exports.jsonCopy = void 0;
function jsonCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
exports.jsonCopy = jsonCopy;
function shallowCopy(obj) {
    if (primitives.has(typeof obj))
        return obj;
    return Object.assign({}, obj);
}
exports.shallowCopy = shallowCopy;
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
function deepCopy(obj) {
    const visited = new WeakMap();
    const result = _deepCopy(obj, visited);
    return result;
}
exports.deepCopy = deepCopy;
const primitives = new Set(['string', 'number', 'boolean', 'bigint', 'symbol', 'null', 'undefined']);
function _deepCopy(obj, visited) {
    var _a;
    const isPrimitive = primitives.has(typeof obj);
    if (isPrimitive) {
        return obj;
    }
    // Handle basic collection objects
    if (Array.isArray(obj)) {
        return deepCopyArray(obj, visited);
    }
    if (obj instanceof Map) {
        return deepCopyMap(obj, visited);
    }
    if (obj instanceof Set) {
        return deepCopySet(obj, visited);
    }
    if (obj instanceof WeakMap) {
        return deepCopyWeakMap(obj, visited);
    }
    if (obj instanceof WeakSet) {
        return deepCopyWeakSet(obj, visited);
    }
    const copy = {};
    visited.set(obj, copy);
    let entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
        const [key, val] = entries[i];
        if (typeof val === 'object') {
            const valCopy = (_a = visited.get(val)) !== null && _a !== void 0 ? _a : _deepCopy(val, visited);
            copy[key] = valCopy;
            visited.set(val, valCopy);
        }
        else {
            copy[key] = obj[key];
        }
    }
    return copy;
}
function deepCopyArray(array, visited) {
    const result = array.map(x => _deepCopy(x, visited));
    return result;
}
function deepCopySet(set, visited) {
    const result = new Set();
    const array = Array.from(set);
    for (let i = 0; i < array.length; i++) {
        const val = array[i];
        const copy = _deepCopy(val, visited);
        result.add(copy);
    }
    return result;
}
function deepCopyMap(map, visited) {
    const result = new Map();
    const entries = Array.from(map.entries());
    for (let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i];
        result.set(_deepCopy(k, visited), _deepCopy(v, visited));
    }
    return result;
}
/**
 * WeakSet<K> Facacdc go simulate WeakSet deep copy.
 */
class WeakSetFacade extends WeakSet {
    constructor(weakSet) {
        super();
        this.weakSet = new WeakSet();
        this.notInherited = new WeakSet();
        // Overrie functions to support passing on the operations
        this.orig = {
            delete: weakSet.delete,
            add: weakSet.add,
            has: weakSet.has
        };
        weakSet.delete = (x) => {
            const origHas = this.orig.delete(x);
            if (this.notInherited.has(x)) {
                return origHas;
            }
            if (origHas) {
                this.weakSet.add(x);
                this.notInherited.add(x);
            }
            return this.orig.delete(x);
        };
    }
    /**
     * Appends a new object to the end of the WeakSet.
     */
    add(value) {
        this.weakSet.add(value);
        this.notInherited.add(value);
        return this;
    }
    /**
     * Removes the specified element from the WeakSet.
     * @returns Returns true if the element existed and has been removed, or false if the element does not exist.
     */
    delete(value) {
        if (this.notInherited.has(value)) {
            return this.delete(value);
        }
        this.notInherited.add(value);
        return this.orig.has(value);
    }
    /**
     * @returns a boolean indicating whether an object exists in the WeakSet or not.
     */
    has(value) {
        if (this.notInherited.has(value)) {
            return this.weakSet.has(value);
        }
        return this.orig.has(value);
    }
}
function deepCopyWeakSet(set, visited) {
    const result = new WeakSetFacade(set);
    return result;
}
/**
 * WeakMap<K, V> Facacde to simulate WeakMap deep copy.
 */
class WeakMapFacade extends WeakMap {
    constructor(orig) {
        super();
        this.weakMap = new WeakMap();
        this.notInherited = new WeakSet();
        // Overrie functions to support passing on the operations
        this.orig = {
            set: orig.set,
            get: orig.get,
            has: orig.has,
            delete: orig.delete
        };
        orig.delete = (k) => {
            // Not inherited no need to promote
            if (this.notInherited.has(k)) {
                return this.orig.delete(k);
            }
            // Promote value original value to this.
            const origVal = this.orig.get(k);
            if (origVal !== undefined) {
                this.weakMap.set(k, origVal);
                this.notInherited.add(k);
            }
            return this.orig.delete(k);
        };
        orig.set = (k, v) => {
            // Not inherited no need to promote
            if (this.notInherited.has(k)) {
                this.orig.set(k, v);
            }
            // Promote original value to this.
            const origVal = this.orig.get(k);
            if (origVal !== undefined) {
                this.weakMap.set(k, origVal);
                this.notInherited.add(k);
            }
            return this.orig.set(k, v);
        };
    }
    /**
     * @returns a specified element.
     */
    get(key) {
        if (this.notInherited.has(key)) {
            return this.weakMap.get(key);
        }
        return this.orig.get(key);
    }
    /**
     * @returns a boolean indicating whether an element with the specified key exists or not.
     */
    has(key) {
        if (this.notInherited.has(key)) {
            return this.weakMap.has(key);
        }
        return this.orig.has(key);
    }
    /**
     * Adds a new element with a specified key and value.
     * @param key Must be an object.
     */
    set(key, value) {
        this.weakMap.set(key, value);
        this.notInherited.add(key);
        return this;
    }
    /**
     * Removes the specified element from the WeakMap.
     * @returns true if the element was successfully removed, or false if it was not present.
     */
    delete(key) {
        if (this.notInherited.has(key)) {
            return this.weakMap.delete(key);
        }
        this.notInherited.add(key);
        return this.orig.has(key);
    }
}
// TODO: Fix this does not work
function deepCopyWeakMap(weakMap, visited) {
    return new WeakMapFacade(weakMap);
}
