# دليل ربط المشروع بـ GitHub (خطوة بخطوة)

بما أنك واجهت مشكلة في الصلاحيات (403 Permission Denied)، فهذا يعني أن جهازك يحاول الاتصال بحساب قديم أو غير مصرح له. إليك الخطوات لتصحيح ذلك:

## 1. التأكد من رابط المستودع الجديد
أولاً، سنقوم بحذف أي رابط قديم وإضافة الرابط الصحيح للمستودع الجديد:

```bash
# حذف الرابط القديم (GitLab أو غيره)
git remote remove origin

# إضافة رابط GitHub الجديد
git remote add origin https://github.com/Amounir930/60sce.shop.git

# التأكد من الرابط
git remote -v
```

## 2. المصادقة (Authentication)
هذه هي الخطوة الأهم. GitHub لم يعد يقبل كلمة المرور العادية، يجب استخدام **Token** أو **GitHub CLI**.

### الخيار الأفضل: استخدام GitHub CLI (إذا كان مثبتاً)
```bash
gh auth login
```
- اختر `GitHub.com`
- اختر `HTTPS`
- اختر `Login with a web browser`
- سيفتح لك المتصفح لتسجيل الدخول بحساب `Amounir930`.

### الخيار البديل: استخدام Token
إذا لم يكن لديك `gh`، عند عمل `git push` سيطلب منك `Username` و `Password`.
- **Username**: `Amounir930`
- **Password**: لا تضع كلمة سر حسابك! ضع **Personal Access Token**.
  - اذهب إلى: GitHub Settings -> Developer settings -> Personal access tokens -> Tokens (classic)
  - انشئ Token جديد بصلاحية `repo` كاملة.
  - انسخه والصقه مكان الباسوورد.

## 3. رفع المشروع (Push)
بعد المصادقة بنجاح، نرفع الملفات:

```bash
git branch -M main
git push -u origin main
git push -u origin --all
git push -u origin --tags
```
