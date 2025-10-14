#!/bin/bash

LOG_FILE="/tmp/crawl-all-categories.log"

echo "📊 Monitoring crawler progress..."
echo ""

while true; do
    clear
    echo "═══════════════════════════════════════════════════════════════"
    echo "             SIGNATURE SOLAR CRAWLER - LIVE STATUS"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    # Count categories processed
    CATEGORIES_DONE=$(grep -c "Crawling:" "$LOG_FILE" 2>/dev/null || echo "0")

    # Get current category
    CURRENT_CATEGORY=$(grep "Crawling:" "$LOG_FILE" 2>/dev/null | tail -1 | sed 's/.*Crawling: //')

    # Count products processed
    PRODUCTS_COMPLETED=$(grep -c "Completed crawl_product" "$LOG_FILE" 2>/dev/null || echo "0")

    # Count errors
    ERRORS=$(grep -c "Error crawling" "$LOG_FILE" 2>/dev/null || echo "0")

    # Get last completed category with success/fail
    LAST_RESULT=$(grep -E "(✅ Success!|❌ Error crawling)" "$LOG_FILE" 2>/dev/null | tail -1)

    echo "📂 Categories: $CATEGORIES_DONE / 12"
    echo "📦 Products processed: $PRODUCTS_COMPLETED"
    echo "❌ Errors: $ERRORS"
    echo ""
    echo "🔄 Current: $CURRENT_CATEGORY"
    echo ""

    if [ -n "$LAST_RESULT" ]; then
        echo "Last completed:"
        echo "  $LAST_RESULT"
    fi

    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "Updating every 30 seconds... (Ctrl+C to stop monitoring)"
    echo "Log file: $LOG_FILE"
    echo ""

    # Check if crawl is complete
    if grep -q "Final Summary" "$LOG_FILE" 2>/dev/null; then
        echo ""
        echo "🎉 CRAWL COMPLETE!"
        echo ""
        grep -A 3 "Final Summary" "$LOG_FILE"
        break
    fi

    sleep 30
done
