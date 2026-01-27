// @refresh reload
import { mount, StartClient } from "@solidjs/start/client";
import { registerPwaSW } from "./services/pwaUpdate";

mount(() => <StartClient />, document.getElementById("app")!);

registerPwaSW();
