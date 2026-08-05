import { NextResponse } from "next/server";

export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({version:"1.6.0"},{headers:{"cache-control":"no-store, no-cache, must-revalidate","pragma":"no-cache","expires":"0"}});}
