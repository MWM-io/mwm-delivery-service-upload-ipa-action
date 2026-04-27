# MWM Delivery Service – Upload IPA GitHub Action

This experimental GitHub Action makes it possible to upload IPA files to the MWM Delivery Service from a GitHub
Action workflow.

## Usage

```yaml
- name: Upload IPA to MWM Delivery Service
  uses: MWM-io/mwm-delivery-service-upload-ipa-action@v1.0.0
  with:
    api_base_url: "https://example.com"
    service_account_id: ${{ secrets.MWM_SERVICE_ACCOUNT_ID }}
    service_account_key: ${{ secrets.MWM_SERVICE_ACCOUNT_KEY }}
    file_path: "./path/to/file.ipa"
    # optionally, you can specify a changelog
    changelog: "a list of changes. markdown is supported."
```

Note: base url, service account id, and service account key are provided by MWM on a partner basis.
