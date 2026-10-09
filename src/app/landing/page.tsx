import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/Icon";

export const metadata: Metadata = {
  title: "Nəbz — AI ilə xidmət keyfiyyəti məşqi və qiymətləndirməsi",
  description:
    "Operator AI müştəri ilə real ssenari üzrə danışır, zəng meyarlar üzrə transkriptdən sitatla qiymətləndirilir, son qərarı insan verir.",
};

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* ── Üst Naviqasiya (Landing Header) ── */}
      <header className="landing-nav-bar">
        <div className="landing-nav-inner">
          <Link href="/landing" className="brand" aria-label="Nəbz Ana Səhifə">
            <span className="brand-mark">
              <Icon name="pulse" width="17" height="17" />
            </span>
            <span>Nəbz</span>
            <span className="brand-caption">xidmət keyfiyyəti</span>
          </Link>

          <nav className="landing-menu" aria-label="Landing naviqasiyası">
            <a href="#nece-isleyir">Necə işləyir?</a>
            <a href="#prinsipler">Prinsiplər</a>
            <a href="#imkanlar">İmkanlar</a>
            <Link href="/dashboard">Panel</Link>
          </nav>

          <div className="landing-nav-actions">
            <span className="company">NovaBank · demo</span>
            <Link href="/" className="btn primary landing-nav-btn">
              <Icon name="phone" width="16" height="16" />
              <span>Məşqə başla</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Bölməsi ── */}
      <section className="landing-hero-wrap">
        <div className="landing-hero-container">
          <div className="landing-hero-text">
            <div className="landing-pill-tag">
              <span className="landing-tag-pulse" />
              <span>NeuroBridge.SI · Baku 2026 Enterprise Həlli</span>
            </div>

            <h1 className="landing-main-title">
              Şirkətlər xidmət keyfiyyətini <span className="highlight-ink">şikayət gələndə</span> deyil, <span className="highlight-accent">hər gün</span> ölçür.
            </h1>

            <p className="landing-lead">
              Operator AI müştəri ilə real iş ssenarisi üzrə danışır.
              Claude zəngi şirkətin standartından çıxarılmış meyarlar üzrə,
              transkriptdən vaxt və sitatla qiymətləndirir.
              <strong> Son qərarı insan verir.</strong>
            </p>

            <div className="landing-actions-group">
              <Link href="/" className="btn primary landing-btn-cta">
                <Icon name="phone" width="18" height="18" />
                <span>Canlı məşqə başla</span>
              </Link>
              <Link href="/dashboard" className="btn landing-btn-secondary">
                <span>Rəhbər paneli</span>
                <Icon name="arrow" width="16" height="16" style={{ transform: "rotate(180deg)" }} />
              </Link>
            </div>

            <div className="landing-hero-guarantees">
              <div className="landing-guarantee-item">
                <Icon name="check" width="15" height="15" />
                <span>Azərbaycan dilində səsli məşq</span>
              </div>
              <div className="landing-guarantee-item">
                <Icon name="check" width="15" height="15" />
                <span>Sübutlu transkript sitatları</span>
              </div>
              <div className="landing-guarantee-item">
                <Icon name="check" width="15" height="15" />
                <span>İşçinin etiraz hüququ</span>
              </div>
            </div>
          </div>

          {/* ── Canlı Məşq Simulyasiyası (Hero Interactive Card) ── */}
          <div className="landing-hero-mockup">
            <div className="landing-mockup-card">
              <div className="landing-mockup-topbar">
                <div className="landing-mockup-header-left">
                  <span className="status-dot animate-pulse-dot" />
                  <span className="mono small">CANLI MƏŞQ ZƏNGİ · 02:44</span>
                </div>
                <span className="pill ok">AI Müştəri Aktivdir</span>
              </div>

              <div className="landing-mockup-body">
                {/* Müştəri / Operator xülasəsi */}
                <div className="landing-mockup-persona">
                  <div className="avatar">LM</div>
                  <div>
                    <div className="persona-title">
                      <strong>Leyla M.</strong>
                      <span className="muted small"> (Müştəri)</span>
                    </div>
                    <div className="muted small">Kartı xaricdə bloklanıb, tələsir və narazıdır</div>
                  </div>
                </div>

                {/* Dialoq zolağı */}
                <div className="landing-mockup-dialogue">
                  <div className="bubble cu animate-fade-in-1">
                    <div className="who">Müştəri · 00:14</div>
                    <div>Salam! Kartım nədənsə bloklanıb, marketdə ödəniş edə bilmirəm, təcili açmalısınız!</div>
                  </div>

                  <div className="bubble op animate-fade-in-2">
                    <div className="who">Operator · 00:22</div>
                    <div>Salam Leyla xanım! Narahatlığınızı başa düşürəm, dərhal yoxlayaq. Təhlükəsizlik üçün doğum tarixinizi qeyd edərdiniz?</div>
                  </div>

                  <div className="bubble cu animate-fade-in-3">
                    <div className="who">Müştəri · 00:31</div>
                    <div>15 mart 1992. Xahiş edirəm tez edin, kassada gözləyirəm.</div>
                  </div>
                </div>

                {/* Canlı dalğa və indikator */}
                <div className="landing-mockup-wave-box">
                  <div className="waveform active">
                    <span style={{ "--height": "28px", "--i": 0 } as React.CSSProperties} />
                    <span style={{ "--height": "40px", "--i": 1 } as React.CSSProperties} />
                    <span style={{ "--height": "16px", "--i": 2 } as React.CSSProperties} />
                    <span style={{ "--height": "36px", "--i": 3 } as React.CSSProperties} />
                    <span style={{ "--height": "22px", "--i": 4 } as React.CSSProperties} />
                    <span style={{ "--height": "42px", "--i": 5 } as React.CSSProperties} />
                    <span style={{ "--height": "18px", "--i": 6 } as React.CSSProperties} />
                    <span style={{ "--height": "32px", "--i": 7 } as React.CSSProperties} />
                  </div>
                  <div className="small muted">
                    AI real vaxtda reaksiya verir və qeydlər aparır
                  </div>
                </div>

                {/* AI Qiymətləndirmə Preview Kartı */}
                <div className="landing-mockup-score-preview">
                  <div className="score-preview-header">
                    <div>
                      <div className="small muted font-semibold">Şəxsiyyətin təsdiqi</div>
                      <div className="small">Standart bənd: 2.1 · Sual dəqiq verildi</div>
                    </div>
                    <span className="score s2">2/2</span>
                  </div>
                  <div className="score-preview-evidence">
                    <span className="mono small">00:22 sitat:</span> "Təhlükəsizlik üçün doğum tarixinizi qeyd edərdiniz?"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Problemlər və Fərqlilik (Problem vs Nəbz) ── */}
      <section className="landing-section" id="nece-isleyir">
        <div className="landing-section-header">
          <div className="landing-badge-label">Klassik yanaşma vs Nəbz</div>
          <h2 className="landing-h2">Xidmət keyfiyyətində ənənəvi boşluqları necə bağlayırıq?</h2>
          <p className="muted">Klassik insan dinləməsi bahalıdır, subyektivdir və zənglərin yalnız 1-2%-ni əhatə edə bilir.</p>
        </div>

        <div className="landing-comparison-grid">
          <div className="card comparison-card old">
            <div className="comparison-badge warn">Klassik QA & Dinləmə</div>
            <ul className="comparison-list">
              <li>
                <strong>Yalnız şikayətdən sonra reaksiya:</strong> Müştəri əsəbiləşib gedəndən sonra problem aşkar olunur.
              </li>
              <li>
                <strong>Təsadüfi və az əhatə:</strong> 100 zəngdən cəmi 1-2-si yoxlanılır, bütöv mənzərə itir.
              </li>
              <li>
                <strong>Subyektiv xal vermə:</strong> Yoxlayan dinləyicinin əhvalından və şəxsi baxışından asılıdır.
              </li>
              <li>
                <strong>Təcrübə azlığı:</strong> İşçi çətin və gərgin müştəri ilə yalnız real işdə qarşılaşanda sınanır.
              </li>
            </ul>
          </div>

          <div className="card comparison-card new">
            <div className="comparison-badge ok">Nəbz ilə Ağıllı Sistem</div>
            <ul className="comparison-list">
              <li>
                <strong>Proaktiv gündəlik məşq:</strong> İşçi çətin müştəri ilə real zəngdən əvvəl AI ilə təhlükəsiz mühitdə məşq edir.
              </li>
              <li>
                <strong>100% şəffaf və sübutlu:</strong> Hər bal transkriptdəki saniyə və dəqiq sözlərlə əsaslandırılır.
              </li>
              <li>
                <strong>Standartlaşdırılmış rubrika:</strong> Bankın öz daxili reqlamentinə tam uyğunlaşdırılmış obyektiv ölçmə.
              </li>
              <li>
                <strong>İnsanın son nəzarəti:</strong> Şübhəli və ya aşağı etibarlı ballar avtomatik rəhbərin yoxlama növbəsinə düşür.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 3 Sadə Addım (Necə işləyir) ── */}
      <section className="landing-section landing-bg-alt">
        <div className="landing-section-header">
          <div className="landing-badge-label">Proses</div>
          <h2 className="landing-h2">Məşqdən rəhbər qərarına qədər 3 addım</h2>
        </div>

        <div className="landing-steps-grid">
          <div className="card step-card">
            <div className="step-num">01</div>
            <h3>Ssenari və Rejim Seçimi</h3>
            <p className="muted">
              Operator və ya rəhbər tələb olunan ssenarini seçir (məs. Bloklanmış kart, Gecikən köçürmə, Kredit şərtləri). Səsli və ya mətn rejimində başlamaq mümkündür.
            </p>
            <div className="step-tag">Bank standartlarına uyğun</div>
          </div>

          <div className="card step-card">
            <div className="step-num">02</div>
            <h3>AI Müştəri ilə Canlı Dialoq</h3>
            <p className="muted">
              AI real müştəri emosiyalarını və gözlənilməz suallarını simulyasiya edir. Əvvəlcədən əzbərlənmiş cavablar keçmir, real dialoq davranışı formalaşır.
            </p>
            <div className="step-tag">Real-vaxt səsli dialoq</div>
          </div>

          <div className="card step-card">
            <div className="step-num">03</div>
            <h3>Dərhal Sübutlu Qiymətləndirmə</h3>
            <p className="muted">
              Zəng bitən kimi Claude hər meyar üzrə bal verir və transkriptdən sitat gətirir. İşçi dərhal nəticəsini görür, rəhbər isə hesabatı təsdiqləyir.
            </p>
            <div className="step-tag">İkiqat şəffaflıq</div>
          </div>
        </div>
      </section>

      {/* ── Əsas Prinsiplərimiz (Qaydalara sadiq) ── */}
      <section className="landing-section" id="prinsipler">
        <div className="landing-section-header">
          <div className="landing-badge-label">Etik AI & Məhsul Fəlsəfəsi</div>
          <h2 className="landing-h2">Etibarlı, ədalətli və insan mərkəzli</h2>
          <p className="muted">Nəbz işçini cəzalandırmaq üçün deyil, inkişaf etdirmək və komandanı gücləndirmək üçün qurulub.</p>
        </div>

        <div className="landing-principles-grid">
          <div className="card principle-card">
            <div className="principle-icon-wrap">
              <Icon name="check" width="22" height="22" />
            </div>
            <h3>Son qərarı insan verir</h3>
            <p className="muted">
              AI heç vaxt yekun inzibati qərar vermir. O, köməkçi ekspert kimi qiymətləndirir; yekun söz həmişə rəhbərin və təlimçinin öhdəsində qalır.
            </p>
          </div>

          <div className="card principle-card">
            <div className="principle-icon-wrap">
              <Icon name="document" width="22" height="22" />
            </div>
            <h3>Hər bal transkriptdən sitatla</h3>
            <p className="muted">
              "Yaxşı danışmadı" kimi mücərrəd rəy yoxdur. Hansı saniyədə hansı sözün deyildiyi və hansı reqlament bəndinin pozulduğu göstərilir.
            </p>
          </div>

          <div className="card principle-card">
            <div className="principle-icon-wrap">
              <Icon name="pulse" width="22" height="22" />
            </div>
            <h3>Emosiya deyil, davranış ölçülür</h3>
            <p className="muted">
              Səsin tembri və ya subyektiv intonasiyaya deyil, reqlamentə uyğun salamlaşma, şəxsiyyət yoxlaması və problemin həlli addımlarına baxılır.
            </p>
          </div>

          <div className="card principle-card">
            <div className="principle-icon-wrap">
              <Icon name="info" width="22" height="22" />
            </div>
            <h3>İşçinin tam etiraz hüququ</h3>
            <p className="muted">
              Operator öz qiymətləndirməsini oxuyur və razılaşmadığı bal olduqda bir kliklə səbəbini yazıb rəhbərin təkrar baxışına göndərə bilir.
            </p>
          </div>
        </div>
      </section>

      {/* ── Şirkət Paneli və Operator Profili İnteqrasiyası ── */}
      <section className="landing-section landing-bg-alt" id="imkanlar">
        <div className="landing-split-feature">
          <div className="feature-text">
            <div className="landing-badge-label">Rəhbər Paneli & Analitika</div>
            <h2 className="landing-h2">Bütün komandanın inkişaf dinamikası bir baxışda</h2>
            <p className="muted">
              Hansı departamentin ən çox çətinlik çəkdiyini, hansı meyarın (məsələn: Empatiya və ya Şəxsiyyət təsdiqi) zəif olduğunu statistik olaraq görün.
            </p>

            <div className="feature-bullets">
              <div className="feature-bullet-item">
                <span className="bullet-dot" />
                <div>
                  <strong>Zəif nöqtələrin aşkar edilməsi:</strong> Hansı standart bəndlərində boşluq olduğunu görüb hədəfli təlimlər keçirin.
                </div>
              </div>
              <div className="feature-bullet-item">
                <span className="bullet-dot" />
                <div>
                  <strong>Yoxlama Növbəsi (Review Queue):</strong> Şübhəli və ya işçilərin etiraz etdiyi zəngləri tək bir ekrandan sürətlə təsdiqləyin və ya düzəldin.
                </div>
              </div>
              <div className="feature-bullet-item">
                <span className="bullet-dot" />
                <div>
                  <strong>Ssenari Yaradıcısı:</strong> Bankın daxili qayda sənədini yükləyərək Claude ilə saniyələr içində yeni məşq ssenarisi formalaşdırın.
                </div>
              </div>
            </div>

            <div className="actions" style={{ marginTop: "24px" }}>
              <Link href="/dashboard" className="btn primary">
                Paneli nəzərdən keçir
              </Link>
              <Link href="/review" className="btn">
                Yoxlama növbəsi
              </Link>
            </div>
          </div>

          <div className="feature-visual">
            <div className="card feature-card-preview">
              <div className="feature-preview-header">
                <strong>Xidmət keyfiyyəti analitikası</strong>
                <span className="pill ok">Canlı Data</span>
              </div>

              <div className="metrics" style={{ gridTemplateColumns: "repeat(2, 1fr)", marginBottom: "16px" }}>
                <div className="card metric" style={{ padding: "14px" }}>
                  <div className="muted small">Orta Keyfiyyət Balı</div>
                  <div className="metric-value" style={{ fontSize: "24px" }}>
                    8.4 <span>/ 12</span>
                  </div>
                </div>
                <div className="card metric" style={{ padding: "14px" }}>
                  <div className="muted small">Aşağı Etibarlılıq</div>
                  <div className="metric-value warn-text" style={{ fontSize: "24px" }}>
                    2 <span>zəng</span>
                  </div>
                </div>
              </div>

              <div className="bar-list">
                <div className="bar-item">
                  <span>Salamlaşma</span>
                  <div className="bar-track"><div style={{ width: "90%" }} /></div>
                  <span className="mono">1.8</span>
                </div>
                <div className="bar-item">
                  <span>Şəxsiyyət təsdiqi</span>
                  <div className="bar-track"><div style={{ width: "75%" }} /></div>
                  <span className="mono">1.5</span>
                </div>
                <div className="bar-item weakest">
                  <span>Empatiya</span>
                  <div className="bar-track"><div style={{ width: "55%" }} /></div>
                  <span className="mono">1.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section className="landing-banner-cta">
        <div className="landing-banner-content">
          <div className="banner-logo-wrap">
            <img
              src="/brand/nebz-logo-light.svg"
              alt="Nəbz — dialoq və inkişaf"
              width="210"
              height="57"
            />
          </div>

          <h2 className="banner-title">Xidmət standartlarınızı bu gündən gücləndirin</h2>
          <p className="banner-desc">
            Süni intellekt müştəri ilə real təcrübə toplayın, riskləri azaldın və müştəri məmnuniyyətini zirvəyə çatdırın.
          </p>

          <div className="banner-actions">
            <Link href="/" className="btn landing-btn-white">
              <Icon name="phone" width="18" height="18" />
              <span>İlk məşq zəngini başlat</span>
            </Link>
            <Link href="/scenarios/new" className="btn landing-btn-outline-white">
              <Icon name="plus" width="18" height="18" />
              <span>Yeni ssenari yarat</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer-main">
        <div className="landing-footer-inner">
          <div className="footer-left">
            <div className="footer-brand">
              <span className="brand-mark small-mark">
                <Icon name="pulse" width="14" height="14" />
              </span>
              <strong>Nəbz</strong>
              <span className="muted small">· NeuroBridge.SI Baku 2026 Hackathonu</span>
            </div>
            <p className="muted small" style={{ marginTop: "6px" }}>
              AI Enterprise Solutions kateqoriyası üzrə hazırlanmış xidmət keyfiyyəti platforması.
            </p>
          </div>

          <div className="footer-links">
            <Link href="/" className="plain-link small">Ssenarilər</Link>
            <Link href="/dashboard" className="plain-link small">Panel</Link>
            <Link href="/review" className="plain-link small">Rəhbər Yoxlaması</Link>
            <Link href="/me" className="plain-link small">Məşqlərim</Link>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <span className="muted small">NovaBank · demo korporativ mühit</span>
          <span className="muted small">Real şəxsi məlumatlar istifadə olunmur. Ssenarilər sintetikdir.</span>
        </div>
      </footer>
    </div>
  );
}
