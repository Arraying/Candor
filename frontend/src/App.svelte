<script>
	// Import the different pages that can be rendered.
	import Overview from "./pages/Overview.svelte";
	import About from "./pages/About.svelte";
	import Login from "./pages/Login.svelte";
	import Footer from "./component/Footer.svelte";

	// Keep track of the current page.
	let page = "overview";

	/**
	 * Transition to another page.
	 * This will not only transition, but also clear CSS state of the navbar.
	 * @param newPage The new page name.
	 */
	const setPage = (newPage) => {
		// Get all navbar items.
		for (const item of document.getElementsByClassName("navbar-item")) {
			// Force remove focus..
			item.blur();
		}
		for (const item of document.getElementsByClassName("navbar-link")) {
			item.blur();
		}
		page = newPage;
	}
</script>

<main>
	<nav class="navbar is-black" aria-label="main navigation">
		<div class="navbar-brand">
			<a href="/" class="navbar-item is-size-4" on:click|preventDefault={() => setPage("overview")}>
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
				<a href="/" class="navbar-item" on:click|preventDefault={() => setPage("overview")}>
					Pipelines
				</a>
				<a href="/" class="navbar-item" on:click|preventDefault={() => setPage("about")}>
					About
				</a>
			</div>
		  	<div class="navbar-end">
				<a href="/" class="navbar-item" on:click|preventDefault={() => setPage("login")}>
					Login
				</a>
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
	{#if page === "overview"}
		<Overview />
	{:else if page === "about"}
		<About />
	{:else if page === "login"}
		<Login />
	{/if}
	<Footer />
</main>