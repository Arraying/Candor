<script>
	// Import the different components that can be shown.
	import Footer from "./component/Footer.svelte";
	import LoginBox from "./component/LoginBox.svelte";
	import Modal from "./component/Modal.svelte";
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
	<nav class="navbar is-black" aria-label="main navigation">
		<div class="navbar-brand">
			<a href="/" class="navbar-item is-size-4" on:click|preventDefault={viewDefault}>
				<strong>Candor</strong>
			</a>
			<a href="/" role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
				<span aria-hidden="true"></span>
				<span aria-hidden="true"></span>
				<span aria-hidden="true"></span>
			</a>
		</div>
		<div id="navbar" class="navbar-menu">
			<div class="navbar-start">
				<a href="/" class="navbar-item" on:click|preventDefault={viewDefault}>
					Pipelines
				</a>
				<a href="/" class="navbar-item" on:click|preventDefault={() => showModalAbout = true}>
					About
				</a>
			</div>
		  	<div class="navbar-end">
				{#if user}
					<a href="/" class="navbar-item" on:click|preventDefault={logout}>
						Logout
					</a>
				{:else}
					<a href="/" class="navbar-item" on:click|preventDefault={() => showModalLogin = true}>
						Login
					</a>
				{/if}
				<div class="navbar-item">
					<a href="https://github.com/Arraying/Candor" class="button" target="_blank">
						<span class="icon">
							<i class="fab fa-github"></i>
						</span>
						<span>GitHub</span>
					</a>
				</div>
		  	</div>
		</div>
	</nav>
	<Modal active={showModalAbout} on:closeModal={() => showModalAbout = false}>
		<section class="section box">
			<div class="container">
				<h1 class="title">About</h1>
				<h2 class="subtitle has-text-weight-light">Information regarding Candor</h2>
			</div>
		</section>
		<section class="section box">
			<div class="container">
				<h1 class="title">Privacy Policy</h1>
				<h2 class="subtitle has-text-weight-light">Last changed: never</h2>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
					In justo nunc, faucibus sit amet nisi eget, imperdiet molestie leo. 
					Ut quis vehicula justo. Etiam eget velit eget diam auctor pellentesque. 
					Cras vel velit porttitor, tincidunt nisl nec, maximus ipsum. 
					Vestibulum diam nisl, efficitur nec magna eget, eleifend semper massa. 
					Phasellus enim odio, pulvinar commodo interdum eu, consectetur vitae risus. 
					Donec orci sapien, tincidunt in justo molestie, dapibus finibus est. Nam sed ullamcorper turpis. 
					Pellentesque sit amet lectus mollis, venenatis erat sit amet, facilisis nunc. 
					Aliquam sagittis dictum nibh eget elementum. 
					Aliquam lorem odio, dignissim id venenatis quis, elementum non nunc. 
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
					In hac habitasse platea dictumst. 
					Etiam non lectus eu massa tempus molestie.
				</p>
			</div>
		</section>
		<section class="section box">
			<div class="container">
				<h1 class="title">Terms of Service</h1>
				<h2 class="subtitle has-text-weight-light">Last changed: never</h2>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
					In justo nunc, faucibus sit amet nisi eget, imperdiet molestie leo. 
					Ut quis vehicula justo. Etiam eget velit eget diam auctor pellentesque. 
					Cras vel velit porttitor, tincidunt nisl nec, maximus ipsum. 
					Vestibulum diam nisl, efficitur nec magna eget, eleifend semper massa. 
					Phasellus enim odio, pulvinar commodo interdum eu, consectetur vitae risus. 
					Donec orci sapien, tincidunt in justo molestie, dapibus finibus est. Nam sed ullamcorper turpis. 
					Pellentesque sit amet lectus mollis, venenatis erat sit amet, facilisis nunc. 
					Aliquam sagittis dictum nibh eget elementum. 
					Aliquam lorem odio, dignissim id venenatis quis, elementum non nunc. 
					Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
					In hac habitasse platea dictumst. 
					Etiam non lectus eu massa tempus molestie.
				</p>
			</div>
		</section>
	</Modal>
	<!-- Login modal last so that it overrides them all. -->
	<Modal active={showModalLogin} on:closeModal={() => showModalLogin = false}>
		<LoginBox on:loginSuccess={() => showModalLogin = false}/>
	</Modal>
	<Pipeline {pipelineId} {pipelineName} on:closeModal={() => pipelineId = undefined}/>
	<PipelineList on:pipelineSelect={(event) => selectPipeline(event)}/>
	<Footer />
</main>

<style>
	 .box {
        border-radius: 0;
    }
</style>