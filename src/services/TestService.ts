import { injectable } from "inversify";


//This is the ID symbol used by Inversify to identifiy the TestService.  We need this
//because JavaScript does not have any type metadata and interfaces don't actually exist
//so you need to bind to symbols that represent your types.

export const $TestService = Symbol('TestService');

//This is a TestService that will be injected into your app.  You have to mark @injectable() on services.
@injectable()
export class TestService {

    public doSomething():void {
        alert('Test service did something...');
    }
}