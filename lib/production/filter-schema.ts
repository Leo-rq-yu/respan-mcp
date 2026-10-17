// lib/production/filter-schema.ts
//
// The log filters the caller's project can set, so an agent writes its own
// `filters` instead of guessing field names, values and thresholds. No backend
// tool wraps this endpoint yet.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AuthenticatedClient } from "../shared/client.js";
import { rawFetch, requireClient } from "../shared/client.js";
import { READ_ONLY_WORKSPACE_TOOL, textResult } from "../shared/tool-result.js";

export function registerFilterSchemaTools(server: McpServer, client: AuthenticatedClient | null) {
  server.registerTool(
    "log_filter_schema_get",
    {
      description: `List this project's log filters for log_list and log_summary, as the Respan UI offers them: each field (metric), its operators, its meaning, this project's own values and, for numbers, measured percentiles.

Call it when unsure of a field or value, or for vague asks like "slow" or "expensive": use a percentile as the threshold, e.g. latency gte p90. measured_over names the rows a percentile covers (e.g. log_type = 'chat'); add it as a condition too, or the threshold also matches rows outside it. Units: latency in seconds, cost in US dollars. A field can take several conditions, AND-ed: cost gte 0.05 and cost lt 1 is a range.

Listed values can be partial: value_count is the total, metadata values are a sample, and metadata_filters_omitted counts unlisted keys. An unlisted value may still exist; 'metadata__<key>' works for any key. measurements.is_measured is false while a project or environment is first measured: filter from the descriptions now and call again later, not in a loop.`,
      inputSchema: {
        environment: z.string().optional().describe("Measure values and percentiles in this environment only. Pass the environment the following log_list or log_summary call will use. Default: all environments."),
      },
      annotations: READ_ONLY_WORKSPACE_TOOL,
    },
    async (args) => textResult(JSON.stringify(await rawFetch(requireClient(client), "/api/request-logs/filter-schema/", {
      method: "GET",
      query: { environment: args.environment },
    }))),
  );
}
