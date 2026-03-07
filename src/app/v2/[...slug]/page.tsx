import { redirect } from "next/navigation";

export default function V2CompatProxy({
  params,
  searchParams,
}: {
  params: { slug?: string[] };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const slug = params.slug ?? [];
  const target = `/${slug.join("/")}`;

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((v) => qs.append(key, v));
    } else if (value !== undefined) {
      qs.set(key, value);
    }
  }

  redirect(`${target}${qs.toString() ? `?${qs.toString()}` : ""}`);
}
