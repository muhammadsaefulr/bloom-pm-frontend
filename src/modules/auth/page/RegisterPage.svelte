<script lang="ts">
    import {
        Mail,
        Lock,
        Eye,
        EyeOff,
        UserPlus,
        Loader2,
        User,
    } from "@lucide/svelte";
    import { useRegister } from "../hooks/useAuth.js";

    let name = "";
    let email = "";
    let password = "";
    let confirmPassword = "";
    let showPassword = false;
    let showConfirmPassword = false;
    let errors: Record<string, string> = {};

    const register = useRegister();

    function validateForm(): boolean {
        errors = {};

        if (!name.trim()) {
            errors.name = "Name is required";
        }

        if (!email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.email = "Please enter a valid email";
        }

        if (!password) {
            errors.password = "Password is required";
        } else if (password.length < 8) {
            errors.password = "Password must be at least 8 characters";
        }

        if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        return Object.keys(errors).length === 0;
    }

    function handleSubmit() {
        if (!validateForm()) {
            return;
        }

        register.mutate({ name, email, password });
    }
</script>

<div
    class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
>
    <div class="max-w-md w-full">
        <!-- Logo/Brand -->
        <div class="text-center mb-8">
            <h1
                class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"
            >
                Bloom PM
            </h1>
            <p class="mt-2 text-gray-600">
                Create your account to get started.
            </p>
        </div>

        <!-- Register Card -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form on:submit|preventDefault={handleSubmit} class="space-y-5">
                <!-- Name Field -->
                <div>
                    <label
                        for="name"
                        class="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Full Name
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <User class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="name"
                            type="text"
                            bind:value={name}
                            placeholder="John Doe"
                            class="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none {errors.name
                                ? 'border-red-300'
                                : 'border-gray-200'}"
                        />
                    </div>
                    {#if errors.name}
                        <p class="mt-1 text-sm text-red-500">{errors.name}</p>
                    {/if}
                </div>

                <!-- Email Field -->
                <div>
                    <label
                        for="email"
                        class="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Email Address
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <Mail class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="you@example.com"
                            class="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none {errors.email
                                ? 'border-red-300'
                                : 'border-gray-200'}"
                        />
                    </div>
                    {#if errors.email}
                        <p class="mt-1 text-sm text-red-500">{errors.email}</p>
                    {/if}
                </div>

                <!-- Password Field -->
                <div>
                    <label
                        for="password"
                        class="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Password
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <Lock class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            bind:value={password}
                            placeholder="Create a strong password"
                            class="w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none {errors.password
                                ? 'border-red-300'
                                : 'border-gray-200'}"
                        />
                        <button
                            type="button"
                            on:click={() => (showPassword = !showPassword)}
                            class="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {#if showPassword}
                                <EyeOff
                                    class="w-5 h-5 text-gray-400 hover:text-gray-600"
                                />
                            {:else}
                                <Eye
                                    class="w-5 h-5 text-gray-400 hover:text-gray-600"
                                />
                            {/if}
                        </button>
                    </div>
                    {#if errors.password}
                        <p class="mt-1 text-sm text-red-500">
                            {errors.password}
                        </p>
                    {/if}
                </div>

                <!-- Confirm Password Field -->
                <div>
                    <label
                        for="confirmPassword"
                        class="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Confirm Password
                    </label>
                    <div class="relative">
                        <div
                            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                        >
                            <Lock class="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            bind:value={confirmPassword}
                            placeholder="Confirm your password"
                            class="w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none {errors.confirmPassword
                                ? 'border-red-300'
                                : 'border-gray-200'}"
                        />
                        <button
                            type="button"
                            on:click={() =>
                                (showConfirmPassword = !showConfirmPassword)}
                            class="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                            {#if showConfirmPassword}
                                <EyeOff
                                    class="w-5 h-5 text-gray-400 hover:text-gray-600"
                                />
                            {:else}
                                <Eye
                                    class="w-5 h-5 text-gray-400 hover:text-gray-600"
                                />
                            {/if}
                        </button>
                    </div>
                    {#if errors.confirmPassword}
                        <p class="mt-1 text-sm text-red-500">
                            {errors.confirmPassword}
                        </p>
                    {/if}
                </div>

                <!-- Error Message -->
                {#if register.isError}
                    <div
                        class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
                    >
                        {register.error?.message ||
                            "Registration failed. Please try again."}
                    </div>
                {/if}

                <!-- Submit Button -->
                <button
                    type="submit"
                    disabled={register.isPending}
                    class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {#if register.isPending}
                        <Loader2 class="w-5 h-5 animate-spin" />
                        <span>Creating account...</span>
                    {:else}
                        <UserPlus class="w-5 h-5" />
                        <span>Create Account</span>
                    {/if}
                </button>
            </form>

            <!-- Terms -->
            <p class="mt-4 text-xs text-center text-gray-500">
                By signing up, you agree to our
                <a href="/terms" class="text-blue-600 hover:underline"
                    >Terms of Service</a
                >
                and
                <a href="/privacy" class="text-blue-600 hover:underline"
                    >Privacy Policy</a
                >.
            </p>
        </div>

        <!-- Login Link -->
        <p class="mt-6 text-center text-gray-600">
            Already have an account?
            <a
                href="/auth/login"
                class="font-semibold text-blue-600 hover:text-blue-700"
            >
                Sign in
            </a>
        </p>
    </div>
</div>
