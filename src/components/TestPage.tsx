import * as React from "react";
import { lazyInject, url } from "../framework";


export class TestPage extends React.Component {

    public render() {
        return <div>
            <h3>Another Page!</h3>
            Okay <a href={url('app.default')}>lets go back.</a>
        </div>
    }
}