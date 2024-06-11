const deepClone = ( target ) => {
	if ( typeof target !== "object" ) return target;
	return deepMerge(Array.isArray(target) ? [] : {}, target);
};

const deepMerge = ( to, from ) => {
	Object.entries(from)
		.forEach(( [key, value] ) => {
			if ( value === undefined ) return;
			if ( typeof value === "object" ) {
				to[key] = deepClone(value);
				return;
			}
			to[key] = value;
		});
	return to;
};

const getValueFromCurrentClosure = ( v ) => Function(`return deepClone(${v})`)();

const createClosure = () => new Proxy(
	{
		commit() {
			Object.entries(this)
				.filter(( [key] ) => key !== "commit")
				.forEach(( [key, value] ) => {
					Function(`value`, `
						if (typeof ${key} === 'object' && typeof value === 'object') {
							return deepMerge(${key}, value)
						}
						return ${key} = value
					`)(value);
				});
		}
	},
	{
		get( closure, prop ) {
			if ( closure.hasOwnProperty(prop) ) return closure[prop];
			closure[prop] = getValueFromCurrentClosure(prop);
			return closure[prop];
		},
		set( closure, prop, value ) {
			closure[prop] = value;
		}
	}
);

let id = 42;
const user = {
	name: "john",
	age: 13,
	nested: {
		test: 1
	}
};

const closure = createClosure();

console.log("closured primitive value", closure.id);

closure.id = 24;

console.log("closured primitive value after mutation", closure.id);
console.log("original primitive value after mutation", id);

console.log("closured object", closure.user);

closure.user.name = "not a john";

console.log(closure.user.nested);
console.log(closure.user.nested.test);

closure.user.nested.test = 666;

console.log("closured object after mutation", closure.user);
console.log("original object after mutation", user);

closure.commit();

console.log("closured object after commit", user);
console.log("closured primitive after commit", id);
