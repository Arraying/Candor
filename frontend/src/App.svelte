<script>
	// Import the different components that can be shown.
	import About from "./component/About.svelte";
	import Footer from "./component/Footer.svelte";
	import LoginBox from "./component/LoginBox.svelte";
	import Modal from "./component/Modal.svelte";
	import Navbar from "./component/Navbar.svelte";
	import Pipeline from "./component/Pipeline.svelte";
	import PipelineList from "./component/PipelineList.svelte";

	// Svelte hooks.
	import { onMount } from "svelte";

	// Import stateful information.
	import { logout, me } from "./session";
	import { User } from "./store"

	// Keep track of whether to show the different page modals.
	let showModalLogin = false;
	let showModalAbout = false;
	
	// Keep track of the currently selected pipeline.
	let pipelineId;
	let pipelineName;

	// Try to log in when the app starts.
	onMount(async () => {
		await me();
	});

	/**
	 * Shows the default modals.
	 */
	const viewDefault = () => {
		showModalLogin = false;
		showModalAbout = false;
	};

	/**
	 * Triggered when a pipeline is selected, updates the variables.
	 * @param data The selection data.
	 */
	const selectPipeline = (data) => {
		pipelineId = data.detail.id;
		pipelineName = data.detail.name;
	}

	// Keep track of the current user.
	let user;
	User.subscribe(value => user = value);
</script>

<main class="app">
	<Navbar on:goPipelines={viewDefault} on:goAbout={() => showModalAbout = true} on:goLogin={() => showModalLogin = true}/>
	<Modal active={showModalAbout} on:closeModal={() => showModalAbout = false}>
		<About />
	</Modal>
	<!-- Login modal last so that it overrides them all. -->
	<Modal active={showModalLogin} on:closeModal={() => showModalLogin = false}>
		<LoginBox on:loginSuccess={() => showModalLogin = false}/>
	</Modal>
	<Pipeline {pipelineId} {pipelineName} on:closeModal={() => pipelineId = undefined}/>
	<PipelineList on:pipelineSelect={(event) => selectPipeline(event)}/>
	<Footer />
</main>