<template>
    <div class="form-container">
        <div class="form">
            <div class="ho-login-head">
                <img src="/icon.svg" width="44" height="44" alt="" />
                <h1>HetOps Status</h1>
                <p>Sign in to manage monitors, status pages and incidents.</p>
            </div>
            <form aria-label="Login Form" class="pt-3" @submit.prevent="submit">
                <div v-if="!tokenRequired" class="ho-field">
                    <label for="floatingInput">{{ $t("Username") }}</label>
                    <input
                        id="floatingInput"
                        v-model="username"
                        type="text"
                        class="form-control"
                        autocomplete="username"
                        required
                    />
                </div>

                <!-- The id lands on HiddenInput's wrapper, so the label wraps it to stay tied to the input. -->
                <label v-if="!tokenRequired" class="ho-field">
                    <span>{{ $t("Password") }}</span>
                    <HiddenInput
                        id="floatingPassword"
                        v-model="password"
                        autocomplete="current-password"
                        :required="true"
                    />
                </label>

                <div v-if="tokenRequired">
                    <div class="ho-field">
                        <label for="otp">{{ $t("Token") }}</label>
                        <input
                            id="otp"
                            ref="otpInput"
                            v-model="token"
                            type="text"
                            maxlength="6"
                            class="form-control"
                            placeholder="123456"
                            autocomplete="one-time-code"
                            required
                        />
                    </div>
                </div>

                <div class="form-check mb-3 mt-1 ps-0">
                    <div class="form-check">
                        <input
                            id="remember"
                            v-model="$root.remember"
                            type="checkbox"
                            value="remember-me"
                            class="form-check-input"
                        />

                        <label class="form-check-label" for="remember">
                            {{ $t("Remember me") }}
                        </label>
                    </div>
                </div>
                <button class="w-100 btn btn-primary" type="submit" :disabled="processing">
                    {{ $t("Login") }}
                </button>

                <div v-if="res && !res.ok" class="alert alert-danger mt-3" role="alert">
                    {{ $t(res.msg) }}
                </div>
            </form>
        </div>
    </div>
</template>

<script>
import HiddenInput from "./HiddenInput.vue";

export default {
    components: {
        HiddenInput,
    },
    data() {
        return {
            processing: false,
            username: "",
            password: "",
            token: "",
            res: null,
            tokenRequired: false,
        };
    },

    watch: {
        tokenRequired(newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    this.$refs.otpInput?.focus();
                });
            }
        },
    },

    mounted() {
        document.title += " - Login";
    },

    unmounted() {
        document.title = document.title.replace(" - Login", "");
    },

    methods: {
        /**
         * Submit the user details and attempt to log in
         * @returns {void}
         */
        submit() {
            this.processing = true;

            this.$root.login(this.username, this.password, this.token, (res) => {
                this.processing = false;

                if (res.tokenRequired) {
                    this.tokenRequired = true;
                } else {
                    this.res = res;
                }
            });
        },
    },
};
</script>

<style lang="scss" scoped>
.form-container {
    display: flex;
    align-items: center;
    padding-top: 40px;
    padding-bottom: 40px;
}

.form-floating {
    > label {
        padding-left: 1.3rem;
    }

    > .form-control {
        padding-left: 1.3rem;
    }
}

.form {
    width: 100%;
    max-width: 330px;
    padding: 15px;
    margin: auto;
    text-align: center;
}
</style>
