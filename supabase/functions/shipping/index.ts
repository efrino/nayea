import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const KOMERCE_API_KEY = Deno.env.get("KOMERCE_API_KEY") ?? "";
const BASE_URL = "https://api.komerce.id/api/v1";

// CORS headers — must be on EVERY response including preflight
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-action",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  // ── Preflight – MUST return 200 with a text body ──
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace("/shipping", "");

  try {
    let komResponse: Response;

    if (path === "/destination" && req.method === "GET") {
      // GET /destination?search=<keyword>
      const search = url.searchParams.get("search") || "";
      komResponse = await fetch(
        `${BASE_URL}/order/domestic-cost/destination?search=${encodeURIComponent(search)}`,
        {
          headers: {
            "key": KOMERCE_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
    } else if (path === "/cost" && req.method === "POST") {
      // POST /cost — body: { shipper_destination_id, receiver_destination_id, weight, courier }
      const body = await req.json();
      
      const formData = new FormData();
      formData.append("shipper_destination_id", String(body.shipper_destination_id));
      formData.append("receiver_destination_id", String(body.receiver_destination_id));
      formData.append("weight", String(body.weight));
      if (body.item_value) formData.append("item_value", String(body.item_value));
      if (body.courier) formData.append("courier", body.courier);

      komResponse = await fetch(`${BASE_URL}/order/domestic-cost`, {
        method: "POST",
        headers: { "key": KOMERCE_API_KEY },
        body: formData,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown endpoint" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await komResponse.json();
    return new Response(JSON.stringify(data), {
      status: komResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
