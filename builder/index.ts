import {Builder} from "./builder";

export class JsonSql {
    private static singleton: Builder;

    private constructor() {
    }

    // This is how we create a singleton object
    public static getInstance(options?: any): Builder {
        // check if an instance of the class is already created
        if (!JsonSql.singleton) {
            // If not created create an instance of the class
            // store the instance in the variable
            JsonSql.singleton = new Builder(options);
        }
        // return the singleton object
        return JsonSql.singleton;
    }
}
