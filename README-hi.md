<div align="center">

# 📚 dsh-library
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024`, फिर `dsh1024 plugin --profile web add dsh-library` ([deepseek1024.com](https://deepseek1024.com) इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञान-कोष।**

*आयात करें, पुनर्प्राप्त करें, सत्यापित करें — उद्धरण-युक्त हाइब्रिड खोज जिसे आपका एजेंट जाँच सकता है।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-library)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-library.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-library/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-library/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-library?label=version)](https://github.com/PerryLink/dsh-library/releases)
[![npm version](https://img.shields.io/npm/v/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![npm downloads](https://img.shields.io/npm/dm/dsh-library)](https://www.npmjs.com/package/dsh-library)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-library?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-library?ref=badge)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-library
```


</div>

---


**📖 इकोसिस्टम नॉलेज बेस** — मापे गए आँकड़े, मार्केटिंग नहीं: [डेवलपमेंट गाइड · चयन डेटा · रखरखाव मानदंड](https://perrylink.github.io/dsh-plugin-guide/)।

<!-- star-cta -->
## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add github:PerryLink/dsh-library` — `prepare` स्क्रिप्ट केवल प्रोडक्शन निर्भरताओं से बिल्ड करती है।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-library`।
- **tarball चैनल**: इस रेपो में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-library-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-library` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)।

> यदि pnpm इस पैकेज के लिए `ERR_PNPM_IGNORED_BUILDS` दिखाता है (esbuild का हानिरहित प्लेटफ़ॉर्म-बाइनरी सत्यापन), तो अपने `pnpm-workspace.yaml` में `allowBuilds: { esbuild: true }` जोड़ें — `dsh` CLI सटीक स्निपेट प्रिंट करता है।

## ⭐ 如果它帮到了你

यह प्लगइन [DSH प्लगइन परिवार](https://github.com/PerryLink) का हिस्सा है (95 प्लगइन, सभी Apache-2.0)। अगर यह उपयोगी लगे, तो **एक स्टार दें** — इससे कोई सुविधा अनलॉक नहीं होती, पर अगला व्यक्ति इसे खोज में आसानी से पा लेता है।

*English:* part of a 95 plugin family for DeepSeek Harness. If it is useful, **a star helps the next person find it** — nothing is gated behind it.

## What is dsh-library?

DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञान-कोष।

आयात करें, पुनर्प्राप्त करें, सत्यापित करें — उद्धरण-युक्त हाइब्रिड खोज जिसे आपका एजेंट जाँच सकता है।

![dsh-library का टर्मिनल डेमो: dsh-library — install, then ask with [n] citations](https://raw.githubusercontent.com/PerryLink/dsh-library/main/docs/assets/dsh-library-hero.png)

![Animated terminal demo of dsh-library](https://raw.githubusercontent.com/PerryLink/dsh-library/main/docs/assets/dsh-library-demo.gif)

*वही रन, एनिमेटेड।*

## संगतता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (2026-09-25 को सत्यापित: दोहरा typecheck + 89 टेस्ट + self-contained/artifacts गेट; peer रेंज `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0`)। परिवार का एकमात्र पैकेज जिसका वास्तविक alpha.2 होस्ट स्मोक चला है (2026-09-11)। |
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
dsh plugin --profile web add github:PerryLink/dsh-library
```

```sh
# 1. बंडल को अपने प्रोफ़ाइल में इंस्टॉल करें
dsh plugin --profile web add github:PerryLink/dsh-library

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-library

# 2. पुनः आरंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A2 'id: dsh-library'
```

फिर एजेंट से दस्तावेज़ आयात करने और उपयोग करने को कहें:

```
> ./docs/spec.md को docs पुस्तकालय में जोड़ें, फिर उत्तर दें: spec रिट्राई के बारे में क्या कहती है? [n] चिह्नों से उद्धृत करें।
```

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
- **सत्र लॉग**: `library/inject` (id, क्वेरी, चंक ids, पृष्ठ आकार) और `library/purge` (निर्णय) केवल-लॉग ऑडिट घटनाएँ हैं — मॉडल-दृश्य इंजेक्टेड पृष्ठ उनसे पुनर्निर्माण योग्य है। लिखावट होस्ट-गेटेड है: जिन हार्नेस का ज्ञात-प्रकार समूह शब्दावली को कवर करता है वे घटनाएँ पाते हैं, `ignorable`-लिफ़ाफ़े वाले बिल्ड उन्हें चिह्न के साथ पाते हैं, और लिफ़ाफ़ा-रहित बिल्ड (0.1.1-rc.2, 0.1.2-rc.1) लिखावट छोड़ देते हैं — वहाँ लॉग किए गए `tool/call` + `tool/result` घटनाएँ पुनर्निर्माण योग्य ऑडिट-कड़ी बनी रहती हैं।
0.1.2-rc.1 (2026-09-02 को अनुकूलित): सत्र लिफ़ाफ़ा अपना ignorable फ़ील्ड केवल संग्रहीत-लॉग पठन संगतता के लिए रखता है - Session.append अभी भी इसे स्टैम्प नहीं कर सकता, इसलिए गेट व्यवहार अपरिवर्तित है।

## सुरक्षा सीमाएँ

- **डिफ़ॉल्ट रूप से स्थानीय।** शून्य मॉडल डाउनलोड, शून्य नेटवर्क कॉल — स्कोरिंग नियतात्मक हैश व टोकन गणित है। केवल स्पष्ट रूप से कॉन्फ़िगर किया गया एम्बेडर कमांड कोड चलाता है, और उसका प्रोटोकॉल पूर्णता-जाँच और आउटपुट-सीमित है।
- **कोई मनगढ़ंत नहीं।** उद्धरण जाँच वही रिपोर्ट करती है जो पाइपलाइन सत्यापित कर सकती है; संदिग्ध उद्धरण ईमानदारी से दिखते हैं, अनुमान नहीं लगाए जाते।
- **पर्ज सत्यापित होता है।** `library_remove` हटाई गई सामग्री के नियतात्मक हस्ताक्षरों से शेष सूचकांक जाँचता है और सफलता मानने के बजाय अवशेष रिपोर्ट करता है।
- **ज़ोर से विफल।** अमान्य पुस्तकालय नाम, बहुत बड़े दस्तावेज़, अपठनीय फ़ाइलें और कॉन्फ़िगर-पर-अनुपस्थित एम्बेडर सीम स्पष्ट त्रुटि से विफल होते हैं।

## ज्ञात सीमाएँ

- **शाब्दिक-स्तर एम्बेडिंग।** अंतर्निहित हैश एम्बेडर सतही समानता स्कोर करता है, अर्थ नहीं; व्याख्यात्मक वाक्यों पर पुनर्प्राप्ति गुणवत्ता वास्तविक मॉडल से कम है — मज़बूत सिमेंटिक्स के लिए `embedding.command` कॉन्फ़िगर करें।
- **स्थानीय उद्धरण मॉडल।** `library_cite_check` परिणाम-पृष्ठ (`[n]` क्रमांकन) के विरुद्ध सत्यापित करता है, मुक्त स्रोत-नामों के विरुद्ध नहीं; फ़ज़ी स्कोर एक सीमित टोकन-अनुक्रम आंशिक अनुपात है।
- **कोई अंतर्ग्रहण पाइपलाइन नहीं।** दस्तावेज़ पथ से आयात होते हैं (`md`/`txt`); PDF/docx निष्कर्षण v0.1.0 के दायरे से बाहर है।
- **होस्ट-गेटेड ऑडिट घटनाएँ।** `library/inject` / `library/purge` केवल उन्हीं हार्नेस पर लिखी जाती हैं जो उन्हें सँभाल सकें (अनुमतियाँ और डेटा देखें); प्रकाशित `0.1.2-rc.1` लाइन पर (पहले की लिफ़ाफ़ा-रहित लाइनों की तरह) ये नहीं लिखी जातीं, और हर तथ्य टूल कॉल/परिणाम लॉग से पुनर्निर्माण योग्य रहता है।

## विकास

```sh
pnpm install        # node ^22.19 || >=24
pnpm run typecheck  # tsc: src + tests स्थानीय हार्नेस चेकआउट के विरुद्ध
pnpm run typecheck:ci  # tsc प्रकाशित 0.1.7-rc.2 प्रकारों के विरुद्ध (बिना paths)
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

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के **87 सक्रिय रूप से अनुरक्षित** DeepSeek Harness प्लगइन में से एक है। पूरा परिवार **95** प्लगइन है — **5 फ़्रोज़न**, **3 सेवानिवृत्त** — और नीचे संक्षिप्त रखा गया है ताकि हर README की पहली स्क्रीन छोटी रहे। हर पंक्ति देखने के लिए इसे खोलें; कारण स्थिति कॉलम में है।

<details>
<summary>सभी 95 प्लगइन खोलें</summary>

| प्लगइन | एक पंक्ति | स्थिति |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>

</details>

</details>## License

[Apache License 2.0](LICENSE) © 2026 dsh-library contributors

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन DSH Desktop के बिल्ट-इन मार्केट में देखे जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ चुनें**। इंस्टॉलेशन मार्केट के npm-identity सत्यापन और आपकी पुष्टि से ही होता है।
