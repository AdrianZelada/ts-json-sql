export class ValuesStore{

    options: any = {};

    _values: any = {};

    constructor(options? : any) {
        this.options = options || {};
        this._values = this.options.values || {};
    }

    add(name: string, value: any){
        this._values[name] = value;
    }

    set(name: string, value: any){
        this._values[name] = value;
    }

    get(name: string) {
        return this._values[name];
    }

    remove(name: string) {
        delete this._values[name];
    }

    has(name: string) {
        return this._values.hasOwnProperty(name)
    }
}
