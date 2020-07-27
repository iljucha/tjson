// @ts-check
/**
 * Creates tagged JSON strings.\
 * Made to preserve JS types and structures.
 */
export default class TJSON {
    /**
     * Serializes a JavaScript Object into a special JSON-stringified value
     * @public
     * @param {any} value 
     * @param {string|number} [space]
     * @example
     * let tjson = TJSON.stringify({ date: new Date() })
     */
    static stringify(value, space) {
        return JSON.stringify(value, TJSON.replacer, space)
    }

    /**
     * Deserializes a TJSON/JSON string into a JavaScript Object
     * @public
     * @param {string} text
     * @example
     * let obj = TJSON.parse('{"date":"(03)kd45zo3f}')
     * {
     *      date: Date Mon Jul 27 2020 09:02:59 GMT+0200 (Mitteleuropäische Sommerzeit)
     * }
     */
    static parse(text) {
        return JSON.parse(text, TJSON.reviver)
    }

    /**
     * Add new replacer and reviver to en/ decode your own objects.
     * @public
     * @param {string} tag
     * @example
     * TJSON.add("(08)")
     *      .check(val => typeof val === "function")
     *      .replacer(val => val.toString())
     *      .reviver(val => val)
     * 
     * stringified: '(08)() => console.log("lol")'
     * parsed: '() => console.log("lol")'
     */
    static add(tag) {
        TJSON.isString(tag)
        let find = TJSON.find(tag)
        if (find) {
            throw Error("Replacer/ Reviver already exists")
        }
        return {
            /** @param {(val: any) => any} checkExec */
            check: checkExec => {
                TJSON.isFunction(checkExec)
                return {
                    /**
                     * Adds new replacer
                     * @param {(val: any) => any} replaceExec
                     */
                    replacer: (replaceExec) => {
                        TJSON.isFunction(replaceExec)
                        TJSON.replacers.push({ tag, check: checkExec, exec: replaceExec })
                        return {
                            /**
                             * Adds new reviver
                             * @param {(val: any) => any} reviveExec
                             */
                            reviver: (reviveExec) => {
                                TJSON.isFunction(reviveExec)
                                TJSON.revivers.push({ tag, exec: reviveExec })
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Modify loaded encoders
     * @public
     * @param {string} tag
     * @example
     * TJSON.modify("(00)")
     *      .check(val => typeof val === "number")
     *      .check(val => typeof val === "number")
     */
    static modify(tag) {
        TJSON.isString(tag)
        let find = TJSON.find(tag)
        if (!find) {
            throw Error("Replacer/ Reviver not found")
        }
        return {
            /** @param {(val: any) => any} exec */
            check: exec => {
                TJSON.isFunction(exec)
                TJSON.replacers[find[0]].check = exec
                return TJSON.modify(tag)
            },
            /** @param {(val: any) => any} exec */
            replacer: exec => {
                TJSON.isFunction(exec)
                TJSON.replacers[find[0]].exec = exec
                return TJSON.modify(tag)
            },
            /** @param {(val: any) => any} exec */
            reviver: exec => {
                TJSON.isFunction(exec)
                TJSON.revivers[find[1]].exec = exec
                return TJSON.modify(tag)
            }
        }
    }

    /**
     * @private
     * @param {string} tag
     * @returns {number[]} [0] replacer, [1] reviver
     */
    static find(tag) {
        TJSON.isString(tag)
        let replacer = TJSON.replacers.indexOf(TJSON.replacers.find($ => $.tag === tag))
        let reviver = TJSON.replacers.indexOf(TJSON.replacers.find($ => $.tag === tag))
        if (replacer >= 0 && reviver >= 0) {
            return [ replacer, reviver ]
        }
    }

    /**
     * @private
     * @param {any} val 
     */
    static isFunction(val) {
        if (typeof val !== "function") {
            throw TypeError("argument is not a function")
        }
    }

    /**
     * @private
     * @param {any} val 
     */
    static isString(val) {
        if (typeof val !== "string") {
            throw TypeError("argument is not a string")
        }
    }

    /**
     * If you don't need an en/ decoder, you can remove them
     * @param {string} tag
     * @example
     * TJSON.remove("(00)") // If you don't need to encode numbers
     */
    static remove(tag) {
        let [ replacer, reviver ] = TJSON.find(tag)
        if (replacer && reviver) {
            TJSON.replacers.splice(replacer, 0)
            TJSON.revivers.splice(reviver, 0)
        }
    }

    /**
     * The replacer used for the JSON.stringify argument
     * @private
     * @param {string} name 
     * @param {any} val 
     */
    static replacer(name, val) {
        const replacers = TJSON.replacers
        const length = replacers.length
        let i, replacer, success, key, check
        if (typeof val === "object") {
            for (key in val) {
                for (i = 0; i < length; i++) {
                    replacer = replacers[i]
                    check = replacer.check(val[key])
                    if (check) {
                        success = replacer.exec(val[key])
                        if (success) {
                            val[key] = replacer.tag + success
                            break   
                        }
                    }
                }
            }
        }
        return val
    }

    /**
     * The reviver used for the JSON.parse argument
     * @private
     * @param {string} name 
     * @param {any} val 
     */
    static reviver(name, val) {
        const revivers = TJSON.revivers
        const length = revivers.length
        let i, reviver, success
        for (i = 0; i < length; i++) {
            reviver = revivers[i]
            if (typeof val === "string" && val.startsWith(reviver.tag)) {
                success = reviver.exec(val.slice(reviver.tag.length))
                if (success) {
                    val = success
                    break
                }
            }
        }
        return val
    }

    /**
     * Activates all standard encoders and decoders:\
     * **number**, **BigInt**, **RegExp**, **Date**, **Map** and **Set**
     * @public
     */
    static activateStandards() {
        TJSON.standards.forEach($ => TJSON.add($.tag).check($.check).replacer($.replacer).reviver($.reviver))
    }

    /**
     * All the replacers used in the serilization.\
     * Execute TJSON.activateStandards() to load the standard replacers
     * @private
     * @type {{tag: string, check: (val: any) => any, exec: (val: any) => any}[]}
     */
    static replacers = []

    /**
     * All the revivers used in the deserilization.\
     * Execute TJSON.activateStandards() to load the standard revivers
     * @private
     * @type {{tag: string, exec: (val: any) => any}[]}
     */
    static revivers = []

    /**
     * All standard replacers and revivers. Deactivated until TJSON.activateStandards() called
     * @private
     */
    static get standards() {
        return  [
            {
                tag: "(00)", check: v => typeof v === "number",
                replacer: v => v.toString(36), reviver: v => parseInt(v, 36)
            },
            {
                tag: "(01)", check: v => typeof v === "bigint",
                replacer: v => v, reviver: v => BigInt(v)
            },
            {
                tag: "(02)", check: v => v instanceof RegExp,
                replacer: v => v.source + "___flags___" + v.flags,
                reviver: v => RegExp.call(null, ...v.split("___flags___"))
            },
            {
                tag: "(03)", check: v => v instanceof Date,
                replacer: v => v.valueOf().toString(36), reviver: v => new Date(parseInt(v, 36))
            },
            {
                tag: "(04)", check: v => v instanceof Map,
                replacer: v => TJSON.stringify([...v.entries()]), reviver: v => new Map(TJSON.parse(v))
            },
            {
                tag: "(05)", check: v => v instanceof Set,
                replacer: v => TJSON.stringify([...v.values()]), reviver: v => new Set(TJSON.parse(v))
            }
        ]
    }
}