# TJSON
Stringify and parse tagged JSON-strings/ objects

## Usage
```javascript
import TJSON from "@iljucha/tjson"

class User {
    name
    age
    constructor(name, age) {
        this.name = name
        this.age = age
        console.log("user created", this)
    }
}

// built in:
// (00) = number
// (01) = bigint
// (02) = RegExp
// (03) = Date
// (04) = Map
// (05) = Set

TJSON.add("(06)")
    .check(val => val instanceof User)
    .replacer(val => TJSON.stringify(val))
    .reviver(val => {
        let { name, age } = TJSON.parse(val)
        return new User(name, age)
    })

TJSON.add("(07)")
    .check(val => typeof val === "function")
    .replacer(val => val.toString())
    .reviver(val => val)

let js = {
    user: new User("ilja", 27),
    bool: false,
    null: null,
    big: BigInt(-10),
    set: new Set(["item", 12, new Date()]),
    map: new Map([["date", new Date()]]),
    function: () => console.log("i work really hard"),
    userClass: User,
    alias: "iljucha",
    age: 27,
    reg: /nice/gim,
    date: new Date(),
    arr: ["iljucha", 27, /so cool/i, new Date()]
}

let ser = TJSON.stringify(js, 2)

//this creates this output
{
  "user": "(06){\"name\":\"ilja\",\"age\":\"(00)r\"}",
  "bool": false,
  "null": null,
  "big": "(01)-10",
  "set": "(05)[\"item\",\"(00)c\",\"(03)kd48yjwi\"]",
  "map": "(04)[[\"date\",\"(03)kd48yjwi\"]]",
  "function": "(07)() => console.log(\"i work really hard\")",
  "userClass": "(07)class User {\n    name\n    age\n    constructor(name, age) {\n        this.name = name\n        this.age = age\n        console.log(\"user created\", this)\n    }\n}",
  "alias": "iljucha",
  "age": "(00)r",
  "reg": "(02)nice___flags___gim",
  "date": "(03)kd48yjwi",
  "arr": [
    "iljucha",
    "(00)r",
    "(02)so cool___flags___i",
    "(03)kd48yjwi"
  ]
}


let des = TJSON.parse(ser)

//this creates this output
{
  user: User { name: 'ilja', age: 27 },
  bool: false,
  null: null,
  big: -10n,
  set: Set(3) { 'item', 12, 2020-07-27T08:26:06.018Z },
  map: Map(1) { 'date' => 2020-07-27T08:26:06.018Z },
  function: '() => console.log("i work really hard")',
  userClass: 'class User {\n' +
    '    name\n' +
    '    age\n' +
    '    constructor(name, age) {\n' +
    '        this.name = name\n' +
    '        this.age = age\n' +
    '        console.log("user created", this)\n' +
    '    }\n' +
    '}',
  alias: 'iljucha',
  age: 27,
  reg: /nice/gim,
  date: 2020-07-27T08:26:06.018Z,
  arr: [ 'iljucha', 27, /so cool/i, 2020-07-27T08:26:06.018Z ]
}

let desUserClass = new Function("return " + des.userClass)()
let desFunction = new Function("return " + des.function)()

new desUserClass("yo", 10) // user created, { name: "yo", age: "10" }
desFunction() // i work really hard
```
