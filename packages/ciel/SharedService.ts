
// Shared composable vs globally shared state
// Shared composable/service: initiated on first use and disposed on last use instead of existing for lifetime of app

function createSharedService(setup: (...args: any) => any) {
    let service: any;
    let serviceUser = 0;

    function useService(...args: any) {
        if (service) {
            registerServiceUser();
            return service;
        }
        return collectEffects((flask) => {
            const _service = setup(...args);

            service = _service;
            registerServiceUser(flask);
            return service;
        })
    }

    function registerServiceUser(flask) {
        serviceUser++;
        flask.outer?.onDisposal(() => {
            serviceUser--;
            if (serviceUser === 0) {
                service = null;
            }
            flask.dispose();
        })
    }
    return useService;
}