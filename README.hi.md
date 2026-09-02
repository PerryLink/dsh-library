<div align="center">

# 📚 dsh-library
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-library` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञान-कोष।**

*आयात करें, पुनर्प्राप्त करें, सत्यापित करें — उद्धरण-युक्त हाइब्रिड खोज जिसे आपका एजेंट जाँच सकता है।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh-plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-library/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-library/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-library?label=version)](https://github.com/PerryLink/dsh-library/releases)
[![npm version](https://img.shields.io/npm/v/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![npm downloads](https://img.shields.io/npm/dm/dsh-library)](https://www.npmjs.com/package/dsh-library)

[English](README.md) · [简体中文](README.zh.md) · [Español](README.es.md) · [Português](README.pt.md) · [हिन्दी](README.hi.md)

</div>

---

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `0.1.2-alpha.5` (`0.1.2-alpha.5` के लिए घोषित संगतता) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| भंडारण | कोई भी storage-domain बैकएंड (JSON या SQLite); सूचकांक होस्ट के भंडारण डोमेन में रहता है |
| मॉडल | किसी की आवश्यकता नहीं — अंतर्निहित एम्बेडर नियतात्मक हैश है (शून्य डाउनलोड) |

## आपको क्या मिलता है

`dsh-library` स्थानीय md/txt दस्तावेज़ों को एक क्वेरी-योग्य ज्ञान-कोष में बदलता है, ऐसी गुणवत्ता पाइपलाइन के साथ जिस पर आपका एजेंट भरोसा कर सकता है:

- **`library_add` / `library_remove` / `library_list`** — पथ से दस्तावेज़ आयात करें (चंक + एम्बेड), एक को **पर्ज सत्यापन** के साथ हटाएँ (हटाए गए सामग्री के हस्ताक्षर शेष सूचकांक में जाँचे जाते हैं और कोई अवशेष रिपोर्ट होता है) और दस्तावेज़ मेटाडेटा सूचीबद्ध करें।
- **`library_search`** — हाइब्रिड सिमेंटिक + कीवर्ड रैंकिंग, अधिकतम-सीमांत-प्रासंगिकता विविधता पुनः-क्रम, प्रासंगिकता छंटाई और **lost-in-the-middle से बचाव** (सबसे मज़बूत चंक शीर्ष और पूँछ पर)। `inject: true` के साथ परिणाम-पृष्ठ कॉल करने वाले एजेंट में इंजेक्ट होता है; हर हिट पर `[n]` स्रोत चिह्न होता है और इंजेक्शन `library/inject` सत्र-घटना से पुनर्निर्माण योग्य है (होस्ट-गेटेड; अनुमतियाँ और डेटा देखें)।
- **`library_cite_check`** — उत्तर की `[n]` उद्धरणों को परिणाम-पृष्ठ के विरुद्ध फ़ज़ी टोकन मिलान और सिमेंटिक समानता जाँच से सत्यापित करें।
- **`library_diagnose`** — चंक-आकार हिस्टोग्राम, लगभग-डुप्लिकेट चंक युग्म, एक स्व-पुनर्प्राप्ति जाँच और मध्य-दंड संकेत।
- **`/library`** — प्रति पुस्तकालय एक-पंक्ति सूचकांक सारांश।

```text
दस्तावेज़ ── library_add ─▶ चंक (स्लाइडिंग विंडो) ─▶ एम्बेड (हैश / बाहरी कमांड)
                                   │
                   भंडारण डोमेन (documents / chunks / purges)
                                   │
क्वेरी ── library_search ─▶ हाइब्रिड स्कोर ─▶ MMR पुनः-क्रम ─▶ प्रासंगिकता छंटाई
                                   │                         ─▶ lost-in-middle क्रम
                                   ▼
               [n] चिह्नों वाला परिणाम-पृष्ठ ── inject: true ─▶ एजेंट + library/inject घटना (होस्ट-गेटेड)
```

## त्वरित शुरुआत

```sh
# 1. बंडल को अपने प्रोफ़ाइल में इंस्टॉल करें
dsh plugin --profile web add "github:PerryLink/dsh-library#main"

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-library

# 2. पुनः आरंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

फिर एजेंट से दस्तावेज़ आयात करने और उपयोग करने को कहें:

```
> ./docs/spec.md को docs पुस्तकालय में जोड़ें, फिर उत्तर दें: spec रिट्राई के बारे में क्या कहती है? [n] चिह्नों से उद्धृत करें।
```

## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add "github:PerryLink/dsh-library#main"` — `prepare` स्क्रिप्ट केवल प्रोडक्शन निर्भरताओं से बिल्ड करती है।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-library`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-library-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-library` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

> यदि pnpm इस पैकेज के लिए `ERR_PNPM_IGNORED_BUILDS` दिखाता है (esbuild का हानिरहित प्लेटफ़ॉर्म-बाइनरी सत्यापन), तो अपने `pnpm-workspace.yaml` में `allowBuilds: { esbuild: true }` जोड़ें — `dsh` CLI सटीक स्निपेट प्रिंट करता है।

## कॉन्फ़िगरेशन

सभी समायोजन Schemastery `Config` फ़ील्ड हैं (cordis.yml से बदले जा सकते हैं)। id-लक्षित ओवरराइड पूरी पंक्ति बदल देता है — ज़रूरत की हर कुंजी फिर से लिखें। `cordis.patch.yml` हर कुंजी को इनलाइन समझाता है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `chunkSize` | `900` | स्लाइडिंग-विंडो चंक आकार वर्णों में (≤ 4000) |
| `chunkOverlap` | `120` | लगातार विंडो के बीच ओवरलैप; `chunkSize` से छोटा होना चाहिए |
| `maxFileBytes` | `5242880` | इससे बड़ी फ़ाइलें `library_add` पर अस्वीकार होती हैं |
| `embedding.dims` | `256` | हैश-एम्बेडिंग आयाम (≥ 8) |
| `embedding.provider` | `hash` | एम्बेडर बैकएंड: `hash` (अंतर्निहित, शून्य डाउनलोड), `command` (बाहरी उपप्रक्रिया, `embedding.command` आवश्यक), `ollama` (स्थानीय Ollama, अनुपलब्ध होने पर `hash` में डिग्रेड) |
| `embedding.command` | `''` | वैकल्पिक बाहरी एम्बेडर कमांड (स्पेस-सेपरेटेड argv, कोई शेल नहीं) `ctx.subprocess` से; सेट करने पर `command` बैकएंड चयनित होता है |
| `embedding.ollamaUrl` / `ollamaModel` | `http://127.0.0.1:11434` / `nomic-embed-text` | `ollama` बैकएंड के लिए स्थानीय Ollama एंडपॉइंट व मॉडल (शून्य क्लाउड) |
| `embedding.timeoutMs` / `graceMs` / `maxOutputBytes` / `maxBatchItems` | `30000` / `1000` / `1048576` / `64` | एम्बेडर उपप्रक्रिया बजट |
| `search.topK` | `8` | पूरी पाइपलाइन के बाद लौटे परिणाम |
| `search.hybridWeight` | `0.6` | 0 = केवल कीवर्ड, 1 = केवल सिमेंटिक |
| `search.minRelevance` | `0.15` | इस प्रासंगिकता सीमा से नीचे के चंक छाँटे जाते हैं |
| `search.diversityLambda` | `0.5` | MMR संतुलन: 1 = शुद्ध प्रासंगिकता, 0 = शुद्ध विविधता |
| `search.lostMiddleHead` / `lostMiddleTail` | `1` / `1` | सबसे मज़बूत चंक शीर्ष / पूँछ पर |
| `search.maxResultChars` | `16000` | मॉडल-दृश्य परिणाम-पृष्ठ वर्ण बजट |
| `injection.enabled` / `maxChars` | `true` / `12000` | `library_search` इंजेक्शन व्यवहार व बजट |
| `citation.windowChars` / `minScore` / `minSemantic` | `150` / `40` / `0.1` | `library_cite_check` सीमाएँ |
| `purge.signatureLength` / `maxProbes` | `4` / `24` | पर्ज सत्यापन हस्ताक्षर व जाँच बजट |
| `diagnose.maxDuplicatePairs` / `sampleCap` / `positionBins` | `24` / `200` / `5` | `library_diagnose` बजट सीमाएँ |

## टूल और सतहें

| टूल | टिप्पणियाँ |
|---|---|
| `library_add` | `{ path, library, name? }` → दस्तावेज़ id; फ़ाइल harness फ़ाइल-सेवा से पढ़ी जाती है |
| `library_remove` | `{ library, documentId }` → हटाने का सारांश + पर्ज निर्णय (अवशेष रिपोर्ट) |
| `library_list` | `{ library? }` → दस्तावेज़ मेटाडेटा (कभी पाठ नहीं) |
| `library_search` | `{ query, library, topK?, inject? }` → `[n]` चिह्नों सहित क्रमबद्ध हिट; `inject: true` कॉल करने वाले एजेंट में बीज डालता है |
| `library_cite_check` | `{ library, query, answer }` → प्रति-उद्धरण वैध/अवैध निर्णय (फ़ज़ी + सिमेंटिक) |
| `library_diagnose` | `{ library }` → चंक आँकड़े, डुप्लिकेट, स्व-पुनर्प्राप्ति, मध्य-दंड |
| `/library [name]` | कमांड: प्रति पुस्तकालय दस्तावेज़/चंक सारांश |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: प्लगइन केवल वही फ़ाइलें पढ़ता है जिन्हें `library_add` इंगित करता है (harness फ़ाइल-सेवा और उसकी नीति से) और केवल अपने `dsh_library` भंडारण डोमेन में लिखता है। कोई नेटवर्क अनुरोध नहीं; वैकल्पिक बाहरी एम्बेडर `ctx.subprocess` से बिना शेल-व्याख्या चलता है।
- **डेटा**: चंक पाठ और एम्बेडिंग होस्ट के भंडारण बैकएंड में रहते हैं (डिप्लॉयमेंट के बाकी स्थायी डेटा जैसा ही भरोसा); प्लगइन कोई एन्क्रिप्शन नहीं जोड़ता। दस्तावेज़ पथ और एम्बेडिंग कभी सत्र लॉग में नहीं जाते।
- **सत्र लॉग**: `library/inject` (id, क्वेरी, चंक ids, पृष्ठ आकार) और `library/purge` (निर्णय) केवल-लॉग ऑडिट घटनाएँ हैं — मॉडल-दृश्य इंजेक्टेड पृष्ठ उनसे पुनर्निर्माण योग्य है। लिखावट होस्ट-गेटेड है: जिन हार्नेस का ज्ञात-प्रकार समूह शब्दावली को कवर करता है वे घटनाएँ पाते हैं, `ignorable`-लिफ़ाफ़े वाले बिल्ड उन्हें चिह्न के साथ पाते हैं, और लिफ़ाफ़ा-रहित बिल्ड (0.1.1-rc.2, 0.1.2-alpha.5) लिखावट छोड़ देते हैं — वहाँ लॉग किए गए `tool/call` + `tool/result` घटनाएँ पुनर्निर्माण योग्य ऑडिट-कड़ी बनी रहती हैं।
0.1.2-alpha.5 (2026-09-02 को अनुकूलित): सत्र लिफ़ाफ़ा अपना ignorable फ़ील्ड केवल संग्रहीत-लॉग पठन संगतता के लिए रखता है - Session.append अभी भी इसे स्टैम्प नहीं कर सकता, इसलिए गेट व्यवहार अपरिवर्तित है।

## सुरक्षा सीमाएँ

- **डिफ़ॉल्ट रूप से स्थानीय।** शून्य मॉडल डाउनलोड, शून्य नेटवर्क कॉल — स्कोरिंग नियतात्मक हैश व टोकन गणित है। केवल स्पष्ट रूप से कॉन्फ़िगर किया गया एम्बेडर कमांड कोड चलाता है, और उसका प्रोटोकॉल पूर्णता-जाँच और आउटपुट-सीमित है।
- **कोई मनगढ़ंत नहीं।** उद्धरण जाँच वही रिपोर्ट करती है जो पाइपलाइन सत्यापित कर सकती है; संदिग्ध उद्धरण ईमानदारी से दिखते हैं, अनुमान नहीं लगाए जाते।
- **पर्ज सत्यापित होता है।** `library_remove` हटाई गई सामग्री के नियतात्मक हस्ताक्षरों से शेष सूचकांक जाँचता है और सफलता मानने के बजाय अवशेष रिपोर्ट करता है।
- **ज़ोर से विफल।** अमान्य पुस्तकालय नाम, बहुत बड़े दस्तावेज़, अपठनीय फ़ाइलें और कॉन्फ़िगर-पर-अनुपस्थित एम्बेडर सीम स्पष्ट त्रुटि से विफल होते हैं।

## ज्ञात सीमाएँ

- **शाब्दिक-स्तर एम्बेडिंग।** अंतर्निहित हैश एम्बेडर सतही समानता स्कोर करता है, अर्थ नहीं; व्याख्यात्मक वाक्यों पर पुनर्प्राप्ति गुणवत्ता वास्तविक मॉडल से कम है — मज़बूत सिमेंटिक्स के लिए `embedding.command` कॉन्फ़िगर करें।
- **स्थानीय उद्धरण मॉडल।** `library_cite_check` परिणाम-पृष्ठ (`[n]` क्रमांकन) के विरुद्ध सत्यापित करता है, मुक्त स्रोत-नामों के विरुद्ध नहीं; फ़ज़ी स्कोर एक सीमित टोकन-अनुक्रम आंशिक अनुपात है।
- **कोई अंतर्ग्रहण पाइपलाइन नहीं।** दस्तावेज़ पथ से आयात होते हैं (`md`/`txt`); PDF/docx निष्कर्षण v0.1.0 के दायरे से बाहर है।
- **होस्ट-गेटेड ऑडिट घटनाएँ।** `library/inject` / `library/purge` केवल उन्हीं हार्नेस पर लिखी जाती हैं जो उन्हें सँभाल सकें (अनुमतियाँ और डेटा देखें); प्रकाशित 0.1.1-rc.2 लाइन पर ये नहीं लिखी जातीं, और हर तथ्य टूल कॉल/परिणाम लॉग से पुनर्निर्माण योग्य रहता है।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.2-alpha.5 प्रकारों के विरुद्ध (बिना paths)
pnpm test           # vitest: गुणवत्ता पोर्ट, मूल शब्दावली, वास्तविक-स्टैक संयोजन
pnpm run build      # tsdown बंडल + tsc घोषणाएँ (lib/)
pnpm run verify:self-contained  # निर्भरता स्पेक registry से हल होती हैं
pnpm run verify:artifacts       # निर्मित ESM फ़ेस + बंडल पैच मौजूद
pnpm pack           # प्रकाशित tarball
```

## Topics

`dsh`, `dsh-plugin`, `deepseek-harness`, `deepseek`, `cordis`, `rag`, `knowledge-base`, `retrieval`, `embedding`, `vector-search`, `citation-validation`, `document-library`

## Contributors

- [@PerryLink](https://github.com/PerryLink) — निर्माता और मेंटेनर: आठ गुणवत्ता पोर्ट, भंडारण-डोमेन सूचकांक, हाइब्रिड पुनर्प्राप्ति पाइपलाइन, उद्धरण/पर्ज सत्यापन और पाँच-भाषा दस्तावेज़।

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [33 DeepSeek Harness प्लगइनों](https://github.com/PerryLink) में से एक है। अगर यह आपकी मदद करता है, तो बाकी भी करेंगे:

| Plugin | One-liner |
|---|---|
| **[dsh-dsh-auto-review](https://github.com/PerryLink/dsh-dsh-auto-review)** | अनुमोदन श्रृंखला पर द्वितीय-मॉडल स्वतः-समीक्षा, डिफ़ॉल्ट रूप से विफल-बंद | |
| **[dsh-dsh-background-agents](https://github.com/PerryLink/dsh-dsh-background-agents)** | वेब UI साइडबार, संदेश और अवरोधन के साथ टिकाऊ पृष्ठभूमि चाइल्ड एजेंट | |
| **[dsh-dsh-budget](https://github.com/PerryLink/dsh-dsh-budget)** | DeepSeek Harness के लिए लागत प्रशासन: बजट, कार्बन और विलंबता एक पैनल में। | |
| **[dsh-dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-dsh-checkpoint-rewind)** | Claude Code /rewind-समतुल्य: स्नैपशॉट, सत्र फ़ॉर्क, एक-बार पुनर्स्थापना | |
| **[dsh-dsh-claude-move](https://github.com/PerryLink/dsh-dsh-claude-move)** | Claude Code सत्र, मेमोरी, कौशल और CLAUDE.md को DSH में स्थानांतरित करें | |
| **[dsh-dsh-click](https://github.com/PerryLink/dsh-dsh-click)** | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — Windows पहले। | |
| **[dsh-dsh-composer-history](https://github.com/PerryLink/dsh-dsh-composer-history)** | वेब कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज | |
| **[dsh-dsh-data-quality](https://github.com/PerryLink/dsh-dsh-data-quality)** | डेटासेट गुणवत्ता जाँच व उद्धरण सत्यापन (यहाँ उपभोग किया गया वैकल्पिक संख्या-सेतु) | |
| **[dsh-dsh-defend](https://github.com/PerryLink/dsh-dsh-defend)** | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा। | |
| **[dsh-dsh-doublecheck](https://github.com/PerryLink/dsh-dsh-doublecheck)** | इंजीनियरिंग-अनुशासन रक्षक: आवश्यकताओं की पूछताछ, परीक्षण द्वार, प्रतिद्वंद्वी समीक्षा | |
| **[dsh-dsh-draw](https://github.com/PerryLink/dsh-dsh-draw)** | DeepSeek Harness के लिए एकीकृत स्थैतिक-छवि निर्माण रूटिंग। | |
| **[dsh-dsh-fast](https://github.com/PerryLink/dsh-dsh-fast)** | DeepSeek Harness के लिए रीड-ओनली प्रदर्शन डायग्नोस्टिक्स। | |
| **[dsh-dsh-fund-research](https://github.com/PerryLink/dsh-dsh-fund-research)** | चीनी सार्वजनिक म्यूचुअल फंड के लिए नियतात्मक अनुसंधान रिपोर्ट | |
| **[dsh-dsh-github](https://github.com/PerryLink/dsh-dsh-github)** | DSH के लिए GitHub PR/issues एकीकरण, हर लेखन अनुमोदन-द्वारित | |
| **[dsh-dsh-industry-research](https://github.com/PerryLink/dsh-dsh-industry-research)** | उद्योग-अनुसंधान ऑर्केस्ट्रेशन जो इस प्लगिन के `ctx.researchReport.assemble` से डिलीवरेबल सील करता है | |
| **[dsh-dsh-local-ai](https://github.com/PerryLink/dsh-dsh-local-ai)** | DeepSeek Harness के लिए स्थानीय-मॉडल (Ollama) एकीकरण। | |
| **[dsh-dsh-lsp-actions](https://github.com/PerryLink/dsh-dsh-lsp-actions)** | भाषा सर्वरों पर LSP निदान, फ़ॉर्मेटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना | |
| **[dsh-dsh-mask](https://github.com/PerryLink/dsh-dsh-mask)** | PII मास्किंग मिडलवेयर: मॉडल सीमा पर अनाम करें, डिस्प्ले लेयर पर पुनर्स्थापित करें | |
| **[dsh-dsh-mcp-panel](https://github.com/PerryLink/dsh-dsh-mcp-panel)** | केवल-पढ़ने वाला MCP रनटाइम पैनल: /mcp कमांड + स्थिति, टूल और त्रुटियों वाला Settings टैब | |
| **[dsh-dsh-memento](https://github.com/PerryLink/dsh-dsh-memento)** | अनुमोदन-द्वारित क्रॉस-सत्र मेमोरी: ctx.memory सीम + SQLite + मेमोरी टूल | |
| **[dsh-dsh-observe](https://github.com/PerryLink/dsh-dsh-observe)** | DeepSeek Harness के लिए OpenTelemetry और Langfuse अवलोकनीयता निर्यातक। | |
| **[dsh-dsh-output-styles](https://github.com/PerryLink/dsh-dsh-output-styles)** | Claude Code outputStyles-समतुल्य रनटाइम शैली बदलाव | |
| **[dsh-dsh-permission-rules](https://github.com/PerryLink/dsh-dsh-permission-rules)** | ऑडिट के साथ Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम | |
| **[dsh-dsh-plugin-guide](https://github.com/PerryLink/dsh-dsh-plugin-guide)** | माँग पर एजेंट कौशल के रूप में प्लगइन-विकास ज्ञान आधार | |
| **[dsh-dsh-research-report](https://github.com/PerryLink/dsh-dsh-research-report)** | सामग्री-पता साक्ष्य और सीलबंद संस्करणों वाला सत्यापन-योग्य अनुसंधान-रिपोर्ट इंजन | |
| **[dsh-dsh-score](https://github.com/PerryLink/dsh-dsh-score)** | DeepSeek Harness प्लगिनों की बहु-आयामी गुणवत्ता स्कोरिंग। | |
| **[dsh-dsh-session-pin](https://github.com/PerryLink/dsh-dsh-session-pin)** | टिकाऊ क्रम के साथ वेब साइडबार में सत्र पिन करें | |
| **[dsh-dsh-session-sync](https://github.com/PerryLink/dsh-dsh-session-sync)** | DeepSeek Harness के लिए क्रॉस-डिवाइस सत्र सिंक — आपके सत्र स्टोर का एक समर्पित git मिरर। | |
| **[dsh-dsh-skill-pack-security](https://github.com/PerryLink/dsh-dsh-skill-pack-security)** | सुरक्षा-ऑडिट कौशल पैक: गुप्त स्कैन, निर्भरता और आपूर्ति-श्रृंखला समीक्षा | |
| **[dsh-dsh-talk](https://github.com/PerryLink/dsh-dsh-talk)** | DeepSeek Harness के लिए आवाज़-प्रथम सत्र लूप: बोलें और उत्तर सुनें। | |
| **[dsh-dsh-test-drive](https://github.com/PerryLink/dsh-dsh-test-drive)** | DeepSeek Harness प्लगिनों के लिए पृथक इंस्टॉल-एंड-स्मोक टेस्ट ड्राइव। | |
| **[dsh-dsh-translate](https://github.com/PerryLink/dsh-dsh-translate)** | DeepSeek Harness के लिए वेंडर पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत। | |

## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors
