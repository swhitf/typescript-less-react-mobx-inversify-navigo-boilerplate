import { run } from './framework';
import * as services from './services';
import * as states from './states';


//Here we `run` the application.  We need to pass a roote HTML element where the app will render, a service installer method
//and a state installer method.

run({
    root: document.getElementById('root'),
    services: services.install,
    states: states.install,
});
