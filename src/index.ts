/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Feedback Dashboard API
 *
 * Routes:
 * - GET  /api/feedback      → List feedback (with optional filters)
 * - GET  /api/stats         → Aggregated statistics
 * - POST /api/analyze/:id   → Trigger AI analysis on a feedback entry
 * - All other routes        → Served from static assets (React frontend)
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		// CORS headers for API routes
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		};

		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: corsHeaders });
		}

		try {
			// API Routes
			if (path === '/api/feedback' && request.method === 'GET') {
				return await handleGetFeedback(url, env, corsHeaders);
			}

			if (path === '/api/stats' && request.method === 'GET') {
				return await handleGetStats(env, corsHeaders);
			}

			if (path.startsWith('/api/analyze/') && request.method === 'POST') {
				const id = path.split('/').pop();
				return await handleAnalyze(id, env, corsHeaders);
			}

			// Serve static assets for all other routes
			return env.ASSETS.fetch(request);

		} catch (error) {
			console.error('Error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' },
			});
		}
	},
} satisfies ExportedHandler<Env>;

/**
 * GET /api/feedback
 * Query params: source, sentiment, limit, offset
 */
async function handleGetFeedback(
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const source = url.searchParams.get('source');
	const sentiment = url.searchParams.get('sentiment');
	const days = url.searchParams.get('days');
	const search = url.searchParams.get('search');
	const urgency = url.searchParams.get('urgency');
	const limit = parseInt(url.searchParams.get('limit') || '20');
	const offset = parseInt(url.searchParams.get('offset') || '0');

	let query = 'SELECT * FROM feedback WHERE 1=1';
	const params: (string | number)[] = [];

	if (source) {
		query += ' AND source = ?';
		params.push(source);
	}

	if (sentiment) {
		query += ' AND sentiment = ?';
		params.push(sentiment);
	}

	if (urgency) {
		query += ' AND urgency = ?';
		params.push(urgency);
	}

	if (days) {
		query += ` AND created_at >= datetime('now', '-' || ? || ' days')`;
		params.push(days);
	}

	if (search) {
		query += ' AND content LIKE ?';
		params.push('%' + search + '%');
	}

	// Get total count for pagination
	const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
	const countResult = await env.feedback_db.prepare(countQuery).bind(...params).first();
	const total = (countResult?.total as number) || 0;

	query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
	params.push(limit, offset);

	const result = await env.feedback_db.prepare(query).bind(...params).all();

	return new Response(JSON.stringify({
		data: result.results,
		meta: {
			total,
			limit,
			offset,
			pages: Math.ceil(total / limit),
			currentPage: Math.floor(offset / limit) + 1,
		}
	}), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

/**
 * GET /api/stats
 * Returns aggregated statistics
 */
async function handleGetStats(
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	// Total count
	const totalResult = await env.feedback_db
		.prepare('SELECT COUNT(*) as count FROM feedback')
		.first();

	// Count by source
	const bySourceResult = await env.feedback_db
		.prepare('SELECT source, COUNT(*) as count FROM feedback GROUP BY source')
		.all();

	// Count by sentiment
	const bySentimentResult = await env.feedback_db
		.prepare('SELECT sentiment, COUNT(*) as count FROM feedback GROUP BY sentiment')
		.all();

	// Count by urgency
	const byUrgencyResult = await env.feedback_db
		.prepare('SELECT urgency, COUNT(*) as count FROM feedback GROUP BY urgency')
		.all();

	// Recent feedback count (last 7 days)
	const recentResult = await env.feedback_db
		.prepare(`SELECT COUNT(*) as count FROM feedback WHERE created_at >= datetime('now', '-7 days')`)
		.first();

	// Top themes (parse comma-separated themes and count)
	const themesResult = await env.feedback_db
		.prepare('SELECT themes FROM feedback WHERE themes IS NOT NULL')
		.all();

	// Count theme occurrences
	const themeCounts: Record<string, number> = {};
	for (const row of themesResult.results || []) {
		const themes = (row.themes as string)?.split(',') || [];
		for (const theme of themes) {
			const trimmed = theme.trim();
			if (trimmed) {
				themeCounts[trimmed] = (themeCounts[trimmed] || 0) + 1;
			}
		}
	}

	// Sort themes by count
	const topThemes = Object.entries(themeCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 10)
		.map(([theme, count]) => ({ theme, count }));

	return new Response(JSON.stringify({
		total: totalResult?.count || 0,
		bySource: bySourceResult.results || [],
		bySentiment: bySentimentResult.results || [],
		byUrgency: byUrgencyResult.results || [],
		recentCount: recentResult?.count || 0,
		topThemes,
	}), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

/**
 * POST /api/analyze/:id
 * Triggers AI analysis on a specific feedback entry
 */
async function handleAnalyze(
	id: string | undefined,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	if (!id) {
		return new Response(JSON.stringify({ error: 'Missing feedback ID' }), {
			status: 400,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Fetch the feedback entry
	const feedback = await env.feedback_db
		.prepare('SELECT * FROM feedback WHERE id = ?')
		.bind(id)
		.first();

	if (!feedback) {
		return new Response(JSON.stringify({ error: 'Feedback not found' }), {
			status: 404,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Call Workers AI for analysis
	const prompt = `Analyze this customer feedback and respond with ONLY a JSON object (no markdown, no explanation):
{
  "sentiment": "positive" or "neutral" or "negative",
  "sentiment_score": number from 0-100 (0=very negative, 50=neutral, 100=very positive),
  "themes": ["theme1", "theme2"] (choose from: documentation, pricing, performance, onboarding, bugs, feature-request, ux, support, security, billing),
  "urgency": "low" or "medium" or "high"
}

Feedback: "${feedback.content}"`;

	// @ts-expect-error - model name is valid but type definitions may be outdated
	const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
		prompt,
		max_tokens: 200,
	});

	// Parse AI response
	let analysis;
	try {
		// Extract JSON from response (handle potential markdown wrapping)
		const responseText = (aiResponse as { response: string }).response;
		const jsonMatch = responseText.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			analysis = JSON.parse(jsonMatch[0]);
		} else {
			throw new Error('No JSON found in response');
		}
	} catch (parseError) {
		console.error('Failed to parse AI response:', aiResponse);
		return new Response(JSON.stringify({
			error: 'Failed to parse AI analysis',
			raw: aiResponse
		}), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' },
		});
	}

	// Update the database with analysis results
	const themes = Array.isArray(analysis.themes) ? analysis.themes.join(',') : analysis.themes;
	const sentimentScore = Number.isInteger(analysis.sentiment_score) ? analysis.sentiment_score : null;

	await env.feedback_db
		.prepare(`
			UPDATE feedback
			SET sentiment = ?, sentiment_score = ?, themes = ?, urgency = ?, analyzed_at = datetime('now')
			WHERE id = ?
		`)
		.bind(analysis.sentiment, sentimentScore, themes, analysis.urgency, id)
		.run();

	// Fetch updated record
	const updated = await env.feedback_db
		.prepare('SELECT * FROM feedback WHERE id = ?')
		.bind(id)
		.first();

	return new Response(JSON.stringify({
		message: 'Analysis complete',
		analysis,
		feedback: updated,
	}), {
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}
