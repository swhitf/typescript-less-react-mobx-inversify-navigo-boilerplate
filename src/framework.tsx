import { Container, injectable } from 'inversify';
import getDecorators from 'inversify-inject-decorators';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Navigo from 'navigo';


//
// Interfaces
//

export interface AppInitializer {
    root:Element;
    services: (container:Container)=>void;
    states: AppState[]|((container:Container)=>AppState[]);
}

export interface AppState {
    [key:string]:any;
    name:string;
    path:string;
    view:AppStateViewFactory;
}

export interface AppStateViewFactory {
    (params:any):React.ReactElement<any>;
}

//
// Container
//
const container = new Container();
const { lazyInject, lazyInjectNamed, lazyInjectTagged, lazyMultiInject} = getDecorators(container);

export {
    container,
    lazyInject,
    lazyInjectNamed,
    lazyInjectTagged,
    lazyMultiInject
};

//
// Router
//

const router = new Navigo(null, true);

export function url(stateName:string, params?:any):string {
    return router.generate(stateName, params);
}

export function navigate(stateName:string, params?:any):void {
    router.navigate(url(stateName, params));
}

//
// Loaders
//

export const $Loader = Symbol('Loader');
export interface Loader {
    readonly priority?:number;
    load():Promise<void>;
}

container.bind<Loader>($Loader).toConstantValue({ load: () => Promise.resolve() });

function get_loaders():Loader[] {
    return container
        .getAll<Loader>($Loader)
        .sort((a, b) => (a.priority || 99999) - (b.priority || 99999));
}

//
// StateFilters
//

export interface AppStateChange {
    readonly state:AppState;
    readonly params:any;
    cancel():void;
    redirect(stateName:string, params?:any);
}

export const $StateFilter = Symbol('StateFilter');
export interface StateFilter {
    readonly priority?:number;
    apply(asc:AppStateChange):void;
}

container.bind<StateFilter>($StateFilter).toConstantValue({ apply: x => x })

function apply_filters(state:AppState, params:any):boolean {
    const filters = container
        .getAll<StateFilter>($StateFilter)
        .sort((a, b) => (a.priority || 99999) - (b.priority || 99999));
    const asc = {
        result: true,
        state: state,
        params: params,
        cancel: function() { 
            this.result = false 
        },
        redirect: function (stateName:string, params?:any) {
            this.cancel();
            setTimeout(() => navigate(stateName, params));
        }
    };
    for (let sf of filters) {
        if (asc.result) sf.apply(asc);
        else break;
    }
    return asc.result;
}

export async function run(setup:AppInitializer):Promise<void> {
    console.log('initalizing...');

    //Invoke the initializer
    setup.services(container);
    const root = setup.root;
    const states = typeof(setup.states) === 'function' ? setup.states(container) : setup.states;    

    //Show the loading ui
    ReactDOM.render(<div></div>, root)
    
    //Load all the registered loaders
    console.log('loading...');
    await Promise.all(get_loaders().map(x => x.load()));

    //Compile the states into routes    
    const routes = {} as any;
    for (let st of states) {
        routes[st.path] = {
            as: st.name,
            uses: p => {
                console.log('State:', st.name, p || '')
                if (apply_filters(st, p)) {
                    ReactDOM.render(st.view(p), root);
                }
            },
        };
    }

    //Invoke router to begin
    console.log('ready.');
    router.on(routes).resolve();    
}
