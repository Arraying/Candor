<script>
	// Import the different components that can be shown.
	import About from "./component/About.svelte";
	import Footer from "./component/Footer.svelte";
	import Loading from "./component/Loading.svelte";
	import LoginBox from "./component/LoginBox.svelte";
	import Modal from "./component/Modal.svelte";
	import Navbar from "./component/Navbar.svelte";
	import Pipeline from "./component/Pipeline.svelte";
	import PipelineList from "./component/PipelineList.svelte";

	// Import stateful information.
	import { me } from "./session";

	// Keep track of whether to show the different page modals.
	let showModalLogin = false;
	let showModalAbout = false;
	
	// Keep track of the currently selected pipeline.
	let pipelineId;
	let pipelineName;
	let pipelineList;

	// Keep track of the login process.
	let mePromise = me();

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

	/**
	 * Triggered when the pipeline is closed, updates the list of pipelines.
	 */
	const closePipeline = () => {
		pipelineId = undefined;
		pipelineList.update();
	}
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
	{#await mePromise}
		<Loading />
	{:then}
		<Pipeline {pipelineId} {pipelineName} on:closeModal={closePipeline}/>
		<PipelineList on:pipelineSelect={(event) => selectPipeline(event)} bind:this={pipelineList}/>
	{:catch}
		Could not load self, is the server down?
	{/await}
	<Footer />
</main>