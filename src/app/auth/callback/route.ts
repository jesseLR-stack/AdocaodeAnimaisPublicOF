import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/validation/auth";

/**
 * Retorno dos links enviados por e-mail (confirmação de cadastro e recuperação de senha).
 * Suporta o fluxo PKCE (?code=) e o fluxo por token (?token_hash=&type=).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirect(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const supabase = await createClient();

  let ok = false;
  if (code) {
    ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  } else if (tokenHash && type) {
    ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
  }
  if (!ok) return NextResponse.redirect(`${origin}/entrar?erro=link-invalido`);
  const dest = next === "/painel" ? "/painel?bem-vindo=1" : next;
  return NextResponse.redirect(`${origin}${dest}`);
}
