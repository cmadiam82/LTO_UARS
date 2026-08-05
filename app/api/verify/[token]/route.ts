import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

export async function GET(_request:Request,context:{params:Promise<{token:string}>}){
  const {token}=await context.params;
  const result=await query(`SELECT reference_no,applicant_name,system_name,status,created_at,closed_at FROM uars.access_requests WHERE verification_token::text=$1`,[token]);
  if(!result.rows[0])return NextResponse.json({valid:false,error:"Request verification record not found."},{status:404});
  return NextResponse.json({valid:true,request:result.rows[0]},{headers:{"cache-control":"no-store"}});
}
