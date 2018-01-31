import { Container } from 'inversify';
import { $TestService, TestService } from "./services/TestService";


//Here we register the services and dependencies with the Inversify container:

export const install = (container:Container) => {
    //Services:
    container.bind($TestService).to(TestService);
};