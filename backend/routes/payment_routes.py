import json
import os
import time

from flask import Blueprint, redirect, request

from models import db, Enrollment, Sale
from payment_service import PaymentError, get_payment_status

payment_bp = Blueprint('payment', __name__)
LOG_PATH = '/home/ubuntu/kayakarya_course/.cursor/debug-749551.log'


def _log(location, message, data=None, hypothesis_id='CALLBACK'):
    entry = {
        'sessionId': '749551',
        'hypothesisId': hypothesis_id,
        'location': location,
        'message': message,
        'data': data or {},
        'timestamp': int(time.time() * 1000),
        'runId': 'payment-callback',
    }
    try:
        os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
        with open(LOG_PATH, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except OSError:
        pass


def _app_base_url():
    return os.getenv('APP_URL', 'https://kayakarya.com').rstrip('/')


def _complete_sale(sale, gateway_status):
    sale.status = 'paid' if gateway_status == 'success' else 'cancel'
    enrollment = Enrollment.query.filter_by(
        user_id=sale.user_id,
        course_id=sale.course_id,
    ).first()
    if enrollment:
        enrollment.payment_status = 'paid' if gateway_status == 'success' else 'cancel'
    db.session.commit()
    # #region agent log
    _log('payment_routes.py:_complete_sale', 'sale updated', {
        'invoice_number': sale.invoice_number,
        'sale_status': sale.status,
        'course_id': sale.course_id,
    }, 'E')
    # #endregion


@payment_bp.route('/callback', methods=['GET'])
def payment_callback():
    invoice_number = request.args.get('invoice_number', '')
    callback_status = request.args.get('status', '')
    # #region agent log
    _log('payment_routes.py:payment_callback', 'callback received', {
        'invoice_number': invoice_number,
        'callback_status': callback_status,
    }, 'E')
    # #endregion

    if not invoice_number:
        return redirect(f"{_app_base_url()}/my-courses?payment=invalid")

    sale = Sale.query.filter_by(invoice_number=invoice_number).first()
    if not sale:
        return redirect(f"{_app_base_url()}/my-courses?payment=not_found")

    if sale.status == 'paid':
        return redirect(f"{_app_base_url()}/course/{sale.course_id}?payment=success")

    try:
        gateway_status = get_payment_status(invoice_number)
    except PaymentError:
        return redirect(f"{_app_base_url()}/course/{sale.course_id}?payment=verify_failed")

    if gateway_status == 'success':
        _complete_sale(sale, 'success')
        return redirect(f"{_app_base_url()}/course/{sale.course_id}?payment=success")

    if gateway_status == 'failed':
        _complete_sale(sale, 'failed')
        return redirect(f"{_app_base_url()}/course/{sale.course_id}?payment=failed")

    return redirect(f"{_app_base_url()}/course/{sale.course_id}?payment=pending")
