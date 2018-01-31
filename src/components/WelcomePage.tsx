import * as React from "react";
import { lazyInject, url } from "../framework";
import { TestService, $TestService } from "../services/TestService";


export class WelcomePage extends React.Component {

    //This will auto-inject the TestService from the IoC container via the $TestService identifier
    @lazyInject($TestService)
    private test:TestService;

    public render() {

        return <div>
            <h3>Welcome to our app!</h3>
            <a href={url('app.test')}>We have another page...</a>
            <br />
            or you can click this button to see the TestService in action:
            <br />
            <button onClick={() => this.onTestClick()}>Test Me!</button>
        </div>
    }

    private onTestClick():void {
        this.test.doSomething();
    }
}