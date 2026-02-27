import { createRoot, FromTag, RenderSlot } from "@rue/lumo";
import { Ionic } from "@rue/quarky";
import '../ui/card.css'
import '../ui/field.css'
import '../ui/separator.css'
import '../ui/label.css'

export default function LoginForm({ fields, Slot }: FromTag<{ Slot: RenderSlot, fields: Ionic<{ username: string, password: string }> }>) {
    return (
        <>
            <div class='card-header'>
                <h1 class="mt-0 text-2xl">Async React Course</h1>
                <div class="separator my-4" />
                <div class='card-title'>Login to your account</div>
                <div class='card-description'>
                    Enter your email below to login to your account
                </div>
            </div>
            <div class='card-content'>
                <div class='field-group group/field-group @container/field-group' data-slot='field-group'>
                    <div class='field' role="group" data-slot="field" data-orientation='vertical'>
                        <label class='field-label label group/field-label' for="email" data-slot="field-label">Email</label>
                        <input
                            id="email"
                            mu:value={fields.$username}
                            type="email"
                            placeholder="m@example.com"
                        />
                    </div>
                    <div class='field' role="group" data-slot="field" data-orientation='vertical'>
                        <div class="flex items-center">
                            <label class='field-label label group/field-label' for="password" data-slot="field-label">Password</label>
                        </div>
                        <input
                            id="password"
                            mu:value={fields.$password}
                            type="password"
                        />
                    </div>
                    <div class='field group/field' role="group" data-slot="field" data-orientation='vertical'>
                        {Slot()}
                        <div class='field-description text-center'>
                            Don't have an account? <a href="#">Tough!</a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

if (__STYLE__)
    createRoot(() =>
        <LoginForm fields={Ionic({ username: 'kermit', password: 'intheswamp' })}>
            <div class='button'>Login</div>
        </LoginForm>).mount('#root')