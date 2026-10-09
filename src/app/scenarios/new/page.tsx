import Link from "next/link";
import Icon from "@/components/Icon";
import BuilderClient from "./BuilderClient";

export default function BuilderPage() {
  return <main id="main-content" className="page"><Link href="/scenarios" className="back-link"><Icon name="arrow" width="16" height="16" />Ssenarilər</Link><BuilderClient /></main>;
}
