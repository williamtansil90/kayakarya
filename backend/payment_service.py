import json
import os
import time

import requests

LOG_PATH = '/home/ubuntu/kayakarya_course/.cursor/debug-749551.log'


def _log(location, message, data=None, hypothesis_id='PAY'):
    entry = {
        'sessionId': '749551',
        'hypothesisId': hypothesis_id,
        'location': location,
        'message': message,
        'data': data or {},
        'timestamp': int(time.time() * 1000),
        'runId': 'payment',
    }
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except OSError:
        pass


def _headers():
    api_key = os.getenv('NWT_API_KEY', '')
    headers = {'Content-Type': 'application/json'}
    if api_key:
        headers['X-API-Key'] = api_key
    return headers


def _base_url():
    return os.getenv('NWT_PAYMENT_URL', 'https://pay.nwt.co.id').rstrip('/')


def create_payment(product_description, qty, total_price, callback_url, invoice_number):
    url = f"{_base_url()}/api/v1/payments/create"
    payload = {
        'product_description': product_description,
        'qty': qty,
        'total_price': int(total_price),
        'callback_url': callback_url,
        'invoice_number': invoice_number,
    }
    # #region agent log
    _log('payment_service.py:create_payment', 'creating payment', {
        'url': url,
        'invoice_number': invoice_number,
        'total_price': int(total_price),
    }, 'A')
    # #endregion
    try:
        res = requests.post(url, json=payload, headers=_headers(), timeout=30)
        data = res.json() if res.content else {}
        # #region agent log
        _log('payment_service.py:create_payment', 'payment response', {
            'status_code': res.status_code,
            'invoice_number': invoice_number,
            'has_payment_url': bool(data.get('payment_url')),
        }, 'A')
        # #endregion
        if res.status_code not in (200, 201):
            raise PaymentError(data.get('error') or data.get('message') or f'Payment gateway error ({res.status_code})')
        if not data.get('payment_url'):
            raise PaymentError('Payment gateway did not return payment_url')
        return data
    except requests.RequestException as exc:
        # #region agent log
        _log('payment_service.py:create_payment', 'payment request failed', {
            'invoice_number': invoice_number,
            'error': str(exc),
        }, 'B')
        # #endregion
        raise PaymentError(f'Payment gateway unreachable: {exc}') from exc


def get_payment_status(invoice_number):
    url = f"{_base_url()}/api/v1/payments/status/{invoice_number}"
    # #region agent log
    _log('payment_service.py:get_payment_status', 'checking payment status', {
        'invoice_number': invoice_number,
    }, 'C')
    # #endregion
    try:
        res = requests.get(url, headers=_headers(), timeout=30)
        data = res.json() if res.content else {}
        # #region agent log
        _log('payment_service.py:get_payment_status', 'status response', {
            'status_code': res.status_code,
            'invoice_number': invoice_number,
            'status': data.get('status'),
        }, 'C')
        # #endregion
        if res.status_code != 200:
            raise PaymentError(data.get('error') or data.get('message') or f'Status check failed ({res.status_code})')
        return data.get('status', 'pending')
    except requests.RequestException as exc:
        # #region agent log
        _log('payment_service.py:get_payment_status', 'status request failed', {
            'invoice_number': invoice_number,
            'error': str(exc),
        }, 'D')
        # #endregion
        raise PaymentError(f'Payment status check failed: {exc}') from exc


class PaymentError(Exception):
    pass
