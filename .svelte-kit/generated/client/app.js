export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25')
];

export const server_loads = [];

export const dictionary = {
		"/": [4],
		"/admin": [5,[2]],
		"/admin/cards": [6,[2]],
		"/admin/logs": [7,[2]],
		"/admin/settings": [8,[2]],
		"/admin/transactions": [9,[2]],
		"/admin/users": [10,[2]],
		"/admin/users/[id]": [11,[2]],
		"/dashboard": [12,[3]],
		"/dashboard/accounts": [13,[3]],
		"/dashboard/cards": [14,[3]],
		"/dashboard/security": [15,[3]],
		"/dashboard/settings": [16,[3]],
		"/dashboard/statements": [17,[3]],
		"/dashboard/transactions": [18,[3]],
		"/dashboard/transfer": [19,[3]],
		"/login": [20],
		"/signup": [21],
		"/signup/address": [22],
		"/signup/complete": [23],
		"/signup/personal": [24],
		"/signup/verify": [25]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';