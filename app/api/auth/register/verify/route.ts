import { NextResponse } from "next/server";
import { isAuthorizedAdminPhone, extractPhoneFromQuery } from "@/lib/security";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Verifies if a given phone number is authorized for administrator registration.
 * Keeps the full authorization list confidential on the server.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    // Allow either ?phone=9876543210 (API style) or direct query without param name ?9876543210
    let rawPhone = url.searchParams.get("phone");
    if (!rawPhone) {
      rawPhone = extractPhoneFromQuery(url.search);
    }

    if (!rawPhone) {
      return NextResponse.json(
        {
          authorized: false,
          error: "Admin registration requires an authorized phone number.",
        },
        {
          status: 403,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    const { authorized, normalizedPhone } = await isAuthorizedAdminPhone(rawPhone);
    if (!authorized) {
      return NextResponse.json(
        {
          authorized: false,
          error: "Unauthorized: This phone number is not permitted to register as an administrator.",
        },
        {
          status: 403,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    return NextResponse.json(
      {
        authorized: true,
        phone: normalizedPhone,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { authorized: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = body?.phone;

    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json(
        {
          authorized: false,
          error: "Admin registration requires a valid phone number.",
        },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    const { authorized, normalizedPhone } = await isAuthorizedAdminPhone(rawPhone);
    if (!authorized) {
      return NextResponse.json(
        {
          authorized: false,
          error: "Unauthorized: This phone number is not permitted to register as an administrator.",
        },
        {
          status: 403,
          headers: { "Cache-Control": "no-store, max-age=0" },
        }
      );
    }

    return NextResponse.json(
      {
        authorized: true,
        phone: normalizedPhone,
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { authorized: false, error: message },
      { status: 500 }
    );
  }
}
