<script lang="ts">
  import { Mail, Lock, Eye, EyeOff, LogIn, Loader2 } from "@lucide/svelte";
  import { useLogin } from "../hooks/useAuth.js";

  const authUrl = `${(
    import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"
  ).replace(/\/$/, "")}/auth/google`;
  let email = "";
  let password = "";
  let rememberMe = false;
  let showPassword = false;

  const login = useLogin();

  function handleSubmit() {
    if (!email || !password) {
      return;
    }

    login.mutate({ email, password });
  }
</script>

<div
  class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
>
  <div class="max-w-md w-full">
    <!-- Logo/Brand -->
    <div class="text-center mx-auto mb-8">
      <img src="/BloomLogo.png" alt="Bloom Logo" class="w-48 mx-auto" />
      <p class="mt-2 text-gray-600">
        Welcome back! Please sign in to continue.
      </p>
    </div>

    <!-- Login Card -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <form
        onsubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        class="space-y-6"
      >
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
              class="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-600/20 focus:border-pink-600 transition-all outline-none"
            />
          </div>
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
              placeholder="Enter your password"
              class="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-600/20 focus:border-pink-600 transition-all outline-none"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {#if showPassword}
                <EyeOff class="w-5 h-5 text-gray-400 hover:text-gray-600" />
              {:else}
                <Eye class="w-5 h-5 text-gray-400 hover:text-gray-600" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              bind:checked={rememberMe}
              class="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-600/20"
            />
            <span class="text-sm text-gray-600">Remember me</span>
          </label>
          <a
            href="/auth/forgot-password"
            class="text-sm font-medium text-pink-600 hover:text-pink-600"
          >
            Forgot password?
          </a>
        </div>

        <!-- Error Message -->
        {#if login.isError}
          <div
            class="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
          >
            {login.error?.message || "Invalid email or password"}
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={login.isPending}
          class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-pink-600 to-pink-600 hover:from-pink-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-pink-600/25 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {#if login.isPending}
            <Loader2 class="w-5 h-5 animate-spin" />
            <span>Signing in...</span>
          {:else}
            <LogIn class="w-5 h-5" />
            <span>Sign In</span>
          {/if}
        </button>
      </form>

      <!-- Divider -->
      <div class="relative my-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-3 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <!-- Social Login -->
      <div class="grid grid-cols-1 gap-3">
        <button
          type="button"
          class="flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          onclick={() => (window.location.href = authUrl)}
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span class="text-sm font-medium text-gray-700">Google</span>
        </button>
      </div>
    </div>

    <!-- Sign Up Link -->
    <p class="mt-6 text-center text-gray-600">
      Don't have an account?
      <a
        href="/auth/register"
        class="font-semibold text-pink-600 hover:text-pink-600"
      >
        Sign up for free
      </a>
    </p>
  </div>
</div>
