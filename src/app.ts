//State managment
class ProjectState {
	private listeners: any = [];
	private projects: any[] = [];
	private static instance: ProjectState;
	private constructor() {}

	static getInstance() {
		if (this.instance) {
			return this.instance;
		}
		this.instance = new ProjectState();
		return this.instance;
	}

	addListener(listenerFN: Function) {
		// console.log(listenerFN);
		this.listeners.push(listenerFN);
	}

	addProject(title: string, description: string, numOfPeople: number) {
		const newProject = {
			id: Math.random().toString(),
			title: title,
			description: description,
			people: numOfPeople
		};
		this.projects.push(newProject);
		// console.log(newProject);

		// console.log(this.listeners);

		for (const listenerFn of this.listeners) {
			console.log(listenerFn);
			console.log(this.listeners);

			listenerFn(this.projects.slice());
		}
		// console.log(projectState);
	}
}

const projectState = ProjectState.getInstance();
// console.log(projectState);

//autobind decorator ( .bind(this) )
const autobind = (_: any, _2: string, descriptor: PropertyDescriptor) => {
	const originalMethod = descriptor.value;
	const adjDescriptor: PropertyDescriptor = {
		configurable: true,
		get() {
			const boundFN = originalMethod.bind(this);
			return boundFN;
		}
	};

	return adjDescriptor;
};

//Validation Fn
//Object structure for validation
interface Validatable {
	value: string | number;
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: number;
	max?: number;
}

const validate = (validatableInput: Validatable) => {
	let isValid = true;
	//Required check
	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().trim().length !== 0;
	}
	//Length checks
	if (
		validatableInput.minLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid && validatableInput.value.length > validatableInput.minLength;
	}
	if (
		validatableInput.maxLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid && validatableInput.value.length < validatableInput.maxLength;
	}
	//MinMax checks
	if (
		validatableInput.min != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value > validatableInput.min;
	}
	if (
		validatableInput.max != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value < validatableInput.max;
	}
	//Return
	return isValid;
};

//Defining base template at start
class ProjectInput {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLFormElement;
	titleInputElement: HTMLInputElement;
	descriptionInputElement: HTMLInputElement;
	peopleInputElement: HTMLInputElement;

	constructor() {
		//Creating basic template by reaching out to the DOM
		this.templateElement = document.getElementById(
			"project-input"
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById("app")! as HTMLDivElement;

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLFormElement;
		this.element.id = "user-input";

		//Fetching different values of input fields
		this.titleInputElement = this.element.querySelector(
			"#title"
		) as HTMLInputElement;
		this.descriptionInputElement = this.element.querySelector(
			"#description"
		) as HTMLInputElement;
		this.peopleInputElement = this.element.querySelector(
			"#people"
		) as HTMLInputElement;

		this.configure();
		this.attach();
	}

	//Methods for handling input data
	@autobind
	private submitHandler(event: Event) {
		event.preventDefault();
		const userInput = this.gatherUserInput();
		if (Array.isArray(userInput)) {
			const [title, description, people] = userInput;
			projectState.addProject(title, description, people);
			this.clearInputs();
		}
	}

	private clearInputs() {
		this.titleInputElement.value = "";
		this.descriptionInputElement.value = "";
		this.peopleInputElement.value = "";
	}

	private gatherUserInput(): [string, string, number] | void {
		const enteredTitle = this.titleInputElement.value;
		const enteredDescription = this.descriptionInputElement.value;
		const enteredPeople = this.peopleInputElement.value;

		const titleValidatable: Validatable = {
			value: enteredTitle,
			required: true
		};
		const descriptionValidatable: Validatable = {
			value: enteredDescription,
			required: true,
			minLength: 5
		};
		const peopleValidatable: Validatable = {
			value: enteredPeople,
			required: true,
			min: 1,
			max: 6
		};

		if (
			!validate(titleValidatable) ||
			!validate(descriptionValidatable) ||
			!validate(peopleValidatable)
		) {
			alert("Invalid input, please try again!");
			return;
		} else {
			return [enteredTitle, enteredDescription, +enteredPeople];
		}
	}

	//Methods for rendering html template elements
	private configure() {
		this.element.addEventListener("submit", this.submitHandler);
	}

	private attach() {
		this.hostElement.insertAdjacentElement("afterbegin", this.element);
	}
}

//ProjectList Class
class ProjectList {
	templateElement: HTMLTemplateElement;
	hostElement: HTMLDivElement;
	element: HTMLElement;
	assignedProjects: any[];

	constructor(private type: "active" | "finished") {
		this.templateElement = document.getElementById(
			"project-list"
		)! as HTMLTemplateElement;
		this.hostElement = document.getElementById("app")! as HTMLDivElement;
		this.assignedProjects = [];

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
		this.element = importedNode.firstElementChild as HTMLElement;
		this.element.id = `${this.type}-projects`;

		projectState.addListener((projects: any[]) => {
			this.assignedProjects = projects;
			this.renderProjects();
		});

		this.attach();
		this.renderContent();
	}

	//Methods

	private attach() {
		this.hostElement.insertAdjacentElement("beforeend", this.element);
	}

	private renderContent() {
		const listId = `${this.type}-projects-list`;
		this.element.querySelector("ul")!.id = listId;
		this.element.querySelector("h2")!.textContent =
			this.type.toUpperCase() + " PROJECTS";
	}

	private renderProjects() {
		const listEl = document.getElementById(
			`${this.type}-projects-list`
		)! as HTMLUListElement;
		for (const prjItem of this.assignedProjects) {
			const listItem = document.createElement("li");
			listItem.textContent = prjItem.title;
			listEl.appendChild(listItem);
		}
	}
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
