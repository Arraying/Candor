<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to you</h2>
        <table class="table is-size-5 is-fullwidth is-hoverable">
            <thead>
                <tr>
                <th>Name</th>
                <th><abbr title="Aggregated over all stages">Status</abbr></th>
                <th>Stages</th>
                <th>Last success</th>
                <th>Last failure</th>
                </tr>
            </thead>
            <tbody>
                <tr class="is-clickable">
                    <td>Foo</td>
                    <td>Passed</td>
                    <td>
                        <span class="icon has-text-success">
                        <i class="fas fa-check-circle"></i>
                        </span>
                        <span class="icon has-text-success">
                        <i class="fas fa-check-circle"></i>
                        </span>
                    </td>
                    <td>28.03.02 10:00</td>
                    <td>-</td>
                </tr>
                <tr class="is-clickable">
                    <td>Bar</td>
                    <td>Failed</td>
                    <td>
                        <span class="icon has-text-success">
                        <i class="fas fa-check-circle"></i>
                        </span>
                        <span class="icon has-text-danger">
                        <i class="fas fa-times-circle"></i>
                        </span>
                    </td>
                    <td>28.03.02 10:00</td>
                    <td>28.03.03 10:00</td>
                </tr>
            </tbody>
        </table>
    </div>
</section>