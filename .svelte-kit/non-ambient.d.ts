
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/admin" | "/admin/cards" | "/admin/logs" | "/admin/settings" | "/admin/transactions" | "/admin/users" | "/admin/users/[id]" | "/dashboard" | "/dashboard/accounts" | "/dashboard/cards" | "/dashboard/security" | "/dashboard/settings" | "/dashboard/statements" | "/dashboard/transactions" | "/dashboard/transfer" | "/login" | "/signup" | "/signup/address" | "/signup/complete" | "/signup/personal" | "/signup/verify";
		RouteParams(): {
			"/admin/users/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/admin": { id?: string };
			"/admin/cards": Record<string, never>;
			"/admin/logs": Record<string, never>;
			"/admin/settings": Record<string, never>;
			"/admin/transactions": Record<string, never>;
			"/admin/users": { id?: string };
			"/admin/users/[id]": { id: string };
			"/dashboard": Record<string, never>;
			"/dashboard/accounts": Record<string, never>;
			"/dashboard/cards": Record<string, never>;
			"/dashboard/security": Record<string, never>;
			"/dashboard/settings": Record<string, never>;
			"/dashboard/statements": Record<string, never>;
			"/dashboard/transactions": Record<string, never>;
			"/dashboard/transfer": Record<string, never>;
			"/login": Record<string, never>;
			"/signup": Record<string, never>;
			"/signup/address": Record<string, never>;
			"/signup/complete": Record<string, never>;
			"/signup/personal": Record<string, never>;
			"/signup/verify": Record<string, never>
		};
		Pathname(): "/" | "/admin" | "/admin/cards" | "/admin/logs" | "/admin/settings" | "/admin/transactions" | "/admin/users" | `/admin/users/${string}` & {} | "/dashboard" | "/dashboard/accounts" | "/dashboard/cards" | "/dashboard/security" | "/dashboard/settings" | "/dashboard/statements" | "/dashboard/transactions" | "/dashboard/transfer" | "/login" | "/signup" | "/signup/address" | "/signup/complete" | "/signup/personal" | "/signup/verify";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/logo.png" | "/logo.svg" | string & {};
	}
}